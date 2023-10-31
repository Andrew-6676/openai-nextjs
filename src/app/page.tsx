'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import Chat from '@/app/components/chat';
import styles from './page.module.css';

export default function Home() {
  const { status, data: session } = useSession();
  if (session) {
    return (
      <>
        <Chat />
        <div className={styles.logout}>
          {session.user?.email} <br />
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </>
    );
  }

  let content = (
    <>
      {' '}
      Not signed in
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
  if (status === 'loading') {
    content = <>Loading animation...</>;
  }

  return <div className={styles.login}>{content}</div>;
}
