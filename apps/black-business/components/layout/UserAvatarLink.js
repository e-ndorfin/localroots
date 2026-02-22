"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CustomerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <path d="M9 21V9h6v12"></path>
      <path d="M9 13h6"></path>
      <path d="M7 7h.01M17 7h.01"></path>
    </svg>
  );
}

function DefaultPersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

export default function UserAvatarLink({ role: roleProp }) {
  const [storedRole, setStoredRole] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const role = user.user_metadata?.role || "";
        setStoredRole(role);
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");
      }
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  const role = roleProp ?? storedRole;
  const neutral = role !== "customer" && role !== "business";

  return (
    <div className="avatar-dropdown-wrapper" ref={wrapperRef}>
      {displayName && <span className="avatar-display-name">{displayName}</span>}
      <button
        className={`user-avatar${neutral ? " user-avatar-neutral" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Profile menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {role === "business" ? <BusinessIcon /> : role === "customer" ? <CustomerIcon /> : <DefaultPersonIcon />}
      </button>
      {open && (
        <div className="avatar-dropdown">
          <button className="avatar-dropdown-item avatar-dropdown-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
