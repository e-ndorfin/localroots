"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const saved = window.localStorage.getItem("bb-role");
    setStoredRole(saved || "");
  }, []);

  const role = roleProp ?? storedRole;
  const neutral = role !== "customer" && role !== "business";

  return (
    <Link className={`user-avatar${neutral ? " user-avatar-neutral" : ""}`} href="/login" aria-label="Go to login">
      {role === "business" ? <BusinessIcon /> : role === "customer" ? <CustomerIcon /> : <DefaultPersonIcon />}
    </Link>
  );
}
