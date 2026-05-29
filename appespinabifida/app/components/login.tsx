"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function Login({error}: any) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const canSubmit = email.trim().length > 0 && password.trim().length > 0;

	useEffect(() => {
		if (session?.user) {
			router.replace("/recibos");
		}
	}, [session, router]);

	if (status === "loading") {
		return (
			<main className="fixed inset-0 flex items-center justify-center bg-[#B9E5FB]">
				<p className="text-lg font-semibold text-[#003C64]">Cargando...</p>
			</main>
		);
	}

	if (session?.user) return null;

	return (
		<main className="fixed inset-0 flex items-center justify-center bg-[#B9E5FB] overflow-hidden px-4">
			<section className="w-full max-w-[392px] rounded-[20px] bg-[#003C64] px-7 pb-7 pt-8 shadow-[0_20px_45px_rgba(18,45,76,0.26)] sm:px-8">
				<div className="mb-6 flex items-center justify-center rounded-2xl bg-white px-4 py-3 shadow-[0_8px_18px_rgba(9,24,44,0.16)]">
					<Image
						src="/LOGO-08.jpg"
						alt="Asociacion de Espina Bifida"
						width={220}
						height={112}
						className="h-auto w-[220px]"
					/>
				</div>

				<form
					className="space-y-5"
					aria-label="Formulario de inicio de sesion"
					onSubmit={async (event) => {
						event.preventDefault();

						const formData = new FormData(event.currentTarget);

						const email = formData.get("email");
						const password = formData.get("password");

						await signIn("credentials", {
							email,
							password,
							callbackUrl: "/recibos"
						});

						
					}}
				>
					<div className="space-y-2.5">
						<label
							htmlFor="usuario"
							className="block text-[17px] font-semibold leading-none tracking-tight text-[#BFD3EA]"
						>
							Usuario
						</label>
						<div className="flex h-14 items-center gap-3 rounded-[14px] bg-[#E9E9E9] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								className="h-5 w-5 shrink-0 text-gray-500"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M20 21a8 8 0 0 0-16 0" />
								<circle cx="12" cy="8" r="4" />
							</svg>
							<input
								name="email"
								id="usuario"
								type="text"
								placeholder="Ingresa tu usuario"
								className="h-full w-full bg-transparent text-base text-[#2B2B2B] placeholder:text-gray-400 focus:outline-none"
								autoComplete="username"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2.5">
						<label
							htmlFor="contrasena"
							className="block text-[17px] font-semibold leading-none tracking-tight text-[#BFD3EA]"
						>
							Contraseña
						</label>
						<div className="flex h-14 items-center gap-3 rounded-[14px] bg-[#E9E9E9] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								className="h-5 w-5 shrink-0 text-gray-500"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
							<input
								name="password"
								id="contrasena"
								type={showPassword ? "text" : "password"}
								placeholder="Ingresa tu contraseña"
								className="h-full w-full bg-transparent text-base text-[#2B2B2B] placeholder:text-gray-400 focus:outline-none"
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
								aria-pressed={showPassword}
								className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:text-[#003C64] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C64]"
							>
								{showPassword ? (
									<svg
										aria-hidden="true"
										viewBox="0 0 24 24"
										className="h-5 w-5"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.2 21.2 0 0 1 5.06-5.94" />
										<path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.2 21.2 0 0 1-3.17 4.19" />
										<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
										<line x1="1" y1="1" x2="23" y2="23" />
									</svg>
								) : (
									<svg
										aria-hidden="true"
										viewBox="0 0 24 24"
										className="h-5 w-5"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								)}
							</button>
						</div>
					</div>

					{error === "CredentialsSignin" ? (
						<p className="rounded-[10px] bg-red-500/20 px-4 py-2.5 text-center text-sm font-medium text-red-300">
							Correo o contraseña incorrectos
						</p>
					) : null}

					<button
						type="submit"
						disabled={!canSubmit}
						className="mt-1 flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] bg-white text-xl font-semibold text-[#003C64] shadow-[0_7px_16px_rgba(10,25,44,0.2)] transition-colors hover:bg-[#F7F7F7] disabled:bg-[#B9BDC4] disabled:text-[#7C838D] disabled:shadow-[0_7px_16px_rgba(10,25,44,0.10)] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BFD3EA]"
					>
						Iniciar Sesión
					</button>

					<button
						type="button"
						onClick={() => signIn("google", { callbackUrl: "/asociados" })}
						className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#BFD3EA] bg-white text-base font-semibold text-[#003C64] shadow-[0_6px_16px_rgba(10,25,44,0.16)] transition hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BFD3EA]"
					>
						<svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.67-2.26 1.07-3.72 1.07-2.86 0-5.28-1.93-6.15-4.52H2.18v2.84A11 11 0 0 0 12 23Z"
								fill="#34A853"
							/>
							<path
								d="M5.85 14.13a6.61 6.61 0 0 1 0-4.26V7.03H2.18a11 11 0 0 0 0 9.94l3.67-2.84Z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.35c1.61 0 3.06.55 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.03l3.67 2.84c.87-2.59 3.29-4.52 6.15-4.52Z"
								fill="#EA4335"
							/>
						</svg>
						Continuar con Google
					</button>
				</form>
			</section>
		</main>
	);
}