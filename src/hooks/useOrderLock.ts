import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  acquireOrderLock,
  refreshOrderLock,
  releaseOrderLock,
  type OrderLock,
} from "@/lib/order-lock.functions";

const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

export function useOrderLock(orderId: string, enabled = true) {
  const { user } = useAuth();
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockedBy, setLockedBy] = useState<OrderLock | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [hasMyLock, setHasMyLock] = useState(false);

  const lastActiveRef = useRef(Date.now());
  const isIdleRef = useRef(false);
  const orderIdRef = useRef(orderId);
  const userIdRef = useRef(user?.id);
  const hasMyLockRef = useRef(false);

  orderIdRef.current = orderId;
  userIdRef.current = user?.id;
  hasMyLockRef.current = hasMyLock;

  const getUserName = useCallback(() => {
    if (!user) return "Admin";
    const meta = user.user_metadata;
    if (meta?.full_name) return String(meta.full_name);
    if (meta?.name) return String(meta.name);
    if (user.email) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Admin";
  }, [user]);

  // Attempt to acquire lock
  const tryAcquire = useCallback(async () => {
    if (!user || !orderId || !enabled) return;
    try {
      const res = await acquireOrderLock({
        data: {
          orderId,
          user: {
            id: user.id,
            name: getUserName(),
            email: user.email || "",
          },
        },
      });

      if (res.acquired) {
        setIsLockedByOther(false);
        setLockedBy(null);
        setHasMyLock(true);
        hasMyLockRef.current = true;
      } else if (res.lock) {
        setIsLockedByOther(true);
        setLockedBy(res.lock);
        setHasMyLock(false);
        hasMyLockRef.current = false;
      }
    } catch (err) {
      console.error("Failed to acquire order lock:", err);
    }
  }, [user, orderId, enabled, getUserName]);

  // Explicit release lock (used on exit or right after save)
  const releaseLock = useCallback(async () => {
    if (!orderIdRef.current || !userIdRef.current) return;
    try {
      await releaseOrderLock({
        data: {
          orderId: orderIdRef.current,
          userId: userIdRef.current,
        },
      });
      setHasMyLock(false);
      hasMyLockRef.current = false;
    } catch (err) {
      console.warn("Failed to release order lock:", err);
    }
  }, []);

  // Main lifecycle & presence loop
  useEffect(() => {
    if (!enabled || !orderId || !user) return;

    lastActiveRef.current = Date.now();
    isIdleRef.current = false;
    setIsIdle(false);

    // Initial acquire
    tryAcquire();

    // Listen to user activity to reset idle timer & re-acquire if returned from idle
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
        setIsIdle(false);
        // User came back from idle: re-acquire lock!
        tryAcquire();
      }
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // Heartbeat & Idle detection interval
    const interval = setInterval(async () => {
      const idleTime = Date.now() - lastActiveRef.current;

      if (idleTime >= IDLE_TIMEOUT_MS) {
        // User is idle for 3 minutes!
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          setIsIdle(true);
          // Release lock so other admins aren't blocked
          if (hasMyLockRef.current) {
            await releaseLock();
          }
        }
      } else {
        // User is active, send heartbeat if holding lock
        if (hasMyLockRef.current && userIdRef.current && orderIdRef.current) {
          try {
            const res = await refreshOrderLock({
              data: {
                orderId: orderIdRef.current,
                userId: userIdRef.current,
              },
            });
            if (!res.refreshed) {
              // Lock lost or expired in backend: re-acquire
              tryAcquire();
            }
          } catch (e) {
            console.warn("Heartbeat refresh failed:", e);
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Release lock on tab close / reload
    const handleBeforeUnload = () => {
      if (hasMyLockRef.current && userIdRef.current && orderIdRef.current) {
        releaseLock();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(interval);
      // Release lock on unmount
      if (hasMyLockRef.current && userIdRef.current && orderIdRef.current) {
        releaseOrderLock({
          data: {
            orderId: orderIdRef.current,
            userId: userIdRef.current,
          },
        }).catch(() => {});
      }
    };
  }, [orderId, user?.id, enabled, tryAcquire, releaseLock]);

  return {
    isLockedByOther,
    lockedBy,
    isIdle,
    hasMyLock,
    releaseLock,
    tryAcquire,
  };
}
