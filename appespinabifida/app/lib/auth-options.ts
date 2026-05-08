import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db/user";

const hasGoogleCredentials =
	Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
	providers:
		 [
				GoogleProvider({
					clientId: process.env.GOOGLE_CLIENT_ID as string,
					clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
				}),

				CredentialsProvider({
					name: "credentials",
					credentials: {
						email: {label: "Email", type: "text"},
						password: {label: "Password", type: "password"},
					},
				
			
					async authorize(credentials) {
						if (!credentials?.email || !credentials?.password) return null;

						let user: any = await getUserByEmail(credentials.email);

						if (!user) return null;

						if (!user.password_hash) return null;

						const isValid = await bcrypt.compare(credentials.password, user.password_hash);

						if (!isValid) return null;

						return {
							id: String(user.id_usuario),
							name: user.nombre ?? user.correo,
							email: user.correo,
							role: user.role
						};
					},
				
				}),
			],
			session: {
				strategy: "jwt",
			},

			callbacks: {
				async signIn({user, account}: any){
					if (account?.provider === "google"){
						const existingUser = await getUserByEmail(user.email!);

						if (!existingUser){
							await createUser({
								email: user.email,
								password: null,
								provider: "google",
							});
						}
					}
					
					return true;
				},
				
				async jwt({token, user}: any){
					if (user?.email) {
						const dbUser = await getUserByEmail(user.email);

						if (dbUser) {
						token.id = String(dbUser.id_usuario);
						token.role = dbUser.role;
						token.name = dbUser.nombre ?? dbUser.correo ?? user.name ?? user.email;
						token.email = dbUser.correo ?? user.email;
						}
					}

					return token;
				},

				async session({ session, token}: any){
					if (token) {
						session.user.id = token.id as string;
						session.user.role = token.role as string;
						session.user.name = token.name as string;
						session.user.email = token.email as string;
					}
					return session;
				},
			},
	pages: {
		signIn: "/",
	},
	secret: process.env.NEXTAUTH_SECRET,
};
