import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // Redirect registration to login
  redirect('/sign-in');
}