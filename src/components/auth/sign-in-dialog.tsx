"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { KeyRound } from "lucide-react";
import { onUnauthorized } from "@/lib/guarded-fetch";
import { ClaimAccount } from "@/components/auth/claim-account";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SignInDialogValue {
  /** Open the sign-in prompt imperatively. */
  open: () => void;
  /** Dismiss the sign-in prompt. */
  close: () => void;
}

const SignInDialogContext = createContext<SignInDialogValue>({
  open: () => {},
  close: () => {},
});

export function useSignInDialog() {
  return useContext(SignInDialogContext);
}

/**
 * App-wide sign-in prompt. Opens whenever a guarded request comes back 401 (via
 * {@link onUnauthorized}) — e.g. a dashboard saved to an email opened in a
 * browser that isn't signed in, or an expired session. Reuses the magic-link
 * form so the user can recover access with their email instead of hitting a
 * dead-end "Not authenticated" toast.
 *
 * Mount once inside the dashboard tree (below `SessionProvider`). Because it's
 * the only subscriber and it's scoped to `/dashboard`, a 401 on a public page
 * never pops this dialog.
 */
export function SignInDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Once the user dismisses the prompt, passive background 401s (every page
  // re-fetches profile/endpoints) must NOT keep re-popping it on every screen.
  // Only an explicit `open()` (a user-initiated action) re-arms it.
  const dismissed = useRef(false);

  useEffect(
    () =>
      onUnauthorized(() => {
        if (!dismissed.current) setOpen(true);
      }),
    []
  );

  function handleOpenChange(next: boolean) {
    if (!next) dismissed.current = true;
    setOpen(next);
  }

  return (
    <SignInDialogContext.Provider
      value={{
        open: () => {
          dismissed.current = false;
          setOpen(true);
        },
        close: () => handleOpenChange(false),
      }}
    >
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Sign in to continue
            </DialogTitle>
            <DialogDescription>
              This dashboard is saved to an email, or your session has expired.
              Enter your email and we&apos;ll send a magic sign-in link — no
              password needed.
            </DialogDescription>
          </DialogHeader>
          <ClaimAccount />
        </DialogContent>
      </Dialog>
    </SignInDialogContext.Provider>
  );
}

export default SignInDialogProvider;
