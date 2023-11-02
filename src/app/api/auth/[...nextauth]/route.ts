import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import YandexProvider from 'next-auth/providers/yandex';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: `${process.env.GOOGLE_ID}`,
      clientSecret: `${process.env.GOOGLE_SECRET}`,
    }),
    GithubProvider({
      clientId: `${process.env.GITHUB_ID}`,
      clientSecret: `${process.env.GITHUB_SECRET}`,
    }),
    YandexProvider({
      clientId: `${process.env.YANDEX_ID}`,
      clientSecret: `${process.env.YANDEX_SECRET}`,
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
