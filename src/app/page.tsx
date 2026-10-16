// src/app/page.tsx — Redirect to CRM Overview Dashboard
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard/crm');
}
