"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "next-auth/react";
import ImprimirReciboTemplate from "@/components/imprimirRecibo"
import  Link from "next/link";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import {
	Plus,
	Search,
	Banknote,
	CreditCard,
	Building2,
	ArrowRightLeft,
	Check,
	Receipt,
	Trash2,
	Loader2,
	AlertTriangle,
} from "lucide-react";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { NuevoServicioModal } from "../components/NuevoServicioModal";
import { NuevaConsultaModal } from "../components/reciboWorkflow/nuevaConsultaModal";
import { NuevoEstudioModal } from "../components/reciboWorkflow/nuevoEstudioModal";
import { NewMovementModal } from "../components/inventory/NewMovementModal";
import { cn } from "../lib/utils/cn";
import { searchInventoryItemsByName } from "../lib/api/inventory";
import { createMovement, listMovementItemTypes, listMovements } from "../lib/api/movements";
import type { InventoryItem } from "../lib/types/inventory";
import type { CreateMovementInput, MovementItemType, InventoryMovement } from "../lib/types/movements";

// ─── Types ────────────────────────────────────────────────────────────────────

type Estatus = "Pagado" | "Pagado parcialmente" | "Pendiente";
type MetodoPago = "efectivo" | "tarjeta" | "deposito" | "transferencia";
type TipoPaciente = "A" | "B";
type TipoServicio = "Consulta" | "Estudio";
type TipoZona = "urbano" | "rural";

interface ReciboProducto {
	itemId: number | null;
	itemName: string;
	cantidad: number;
	precioUnitario: number;
}

interface ReciboServicio {
	tipo: TipoServicio;
	precio: number;
}

interface Recibo {
	id: number;
	reciboId?: number | null;
	asociado: string;
	fechaEmision: string;
	fechaLimite?: string;
	montoTotal: number;
	montoPagado: number;
	tipoPaciente: TipoPaciente;
	descuentoPct: number;
	productos: ReciboProducto[];
	exento?: boolean;
	servicios?: ReciboServicio[];
	consultas?: any[];
	estudios?: any[];
}

interface DraftMovement {
	id: string;
	input: CreateMovementInput;
	unitPrice: number;
}

interface Pago {
	id: string;
	idRecibo: string;
	monto: number;
	metodoPago: MetodoPago;
	fechaPago: string;
}

interface AsociadoMini {
	id: string;
	nombre: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function derivarEstatus(r: Recibo): Estatus {
	if (r.montoPagado <= 0) return "Pendiente";
	if (r.montoPagado >= r.montoTotal) return "Pagado";
	return "Pagado parcialmente";
}

function formatCurrency(n: number) {
	return `$${n.toFixed(2)}`;
}

function parseMoneyValue(value: unknown): number {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : 0;
	}
	if (typeof value === "string") {
		const normalized = value.replace(/[^0-9.-]/g, "");
		if (!normalized) return 0;
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function getAsociadoNumericId(asociado: AsociadoMini | null): number | undefined {
	if (!asociado) return undefined;
	const numericId = Number(asociado.id.replace(/^ASC-/, ""));
	return Number.isFinite(numericId) ? numericId : undefined;
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("es-MX", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function createDraftId() {
	return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Discount ─────────────────────────────────────────────────────────────────

const DESCUENTO_DEFAULT: Record<TipoPaciente, number> = { A: 0, B: 50 };

function aplicarDescuento(bruto: number, pct: number): number {
	return Math.round(bruto * (1 - pct / 100) * 100) / 100;
}

// ─── Data layer ───────────────────────────────────────────────────────────────

type RecibosQuery = {
	cursor: string | null;
	limit: number;
	filters: {
		id: string;
		nombre: string;
		fecha: string;
		estatus: string;
	};
};

type RecibosPageResult = {
	items: Recibo[];
	nextCursor: string | null;
};

async function fetchRecibos({ cursor, limit, filters }: RecibosQuery): Promise<RecibosPageResult> {
	const params = new URLSearchParams();
	if (cursor) params.set("cursor", cursor);
	params.set("limit", String(limit));
	if (filters.id) params.set("id", filters.id);
	if (filters.nombre) params.set("nombre", filters.nombre);
	if (filters.fecha) params.set("fecha", filters.fecha);
	if (filters.estatus) params.set("estatus", filters.estatus);

	const res = await fetch(`/api/recibos/obtener?${params.toString()}`);
	if (res.ok){
		const data = await res.json();
		if (Array.isArray(data)) {
			return { items: data, nextCursor: null };
		}
		return {
			items: Array.isArray(data?.items) ? data.items : [],
			nextCursor: data?.nextCursor ?? null,
		};
	}
	return { items: [], nextCursor: null };
}

async function fetchAsociados(): Promise<AsociadoMini[]> {
	// TODO: replace with real API call once endpoint is live
	// const res = await fetch("/api/asociados/lista_asociados");
	// if (!res.ok) throw new Error("Error al cargar asociados");
	// const data: Array<{ id: string; nombre: string }> = await res.json();
	// return data.map((a) => ({ id: String(a.id), nombre: a.nombre }));
	return ASOCIADOS_INICIALES;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTATUS_AMOUNT_CLASS: Record<Estatus, string> = {
	Pagado: "text-emerald-600",
	"Pagado parcialmente": "text-amber-600",
	Pendiente: "text-slate-400",
};

const METODO_LABELS: Record<MetodoPago, string> = {
	efectivo: "Efectivo",
	tarjeta: "Tarjeta",
	deposito: "Depósito",
	transferencia: "Transferencia",
};

const METODOS_PAGO: { id: MetodoPago; nombre: string; icon: React.ReactNode }[] = [
	{ id: "efectivo", nombre: "Efectivo", icon: <Banknote className="h-4 w-4" /> },
	{ id: "tarjeta", nombre: "Tarjeta", icon: <CreditCard className="h-4 w-4" /> },
	{ id: "deposito", nombre: "Depósito", icon: <Building2 className="h-4 w-4" /> },
	{ id: "transferencia", nombre: "Transferencia", icon: <ArrowRightLeft className="h-4 w-4" /> },
];

const ASOCIADOS_INICIALES: AsociadoMini[] = [
	{ id: "1", nombre: "María Guadalupe Hernández Torres" },
	{ id: "2", nombre: "Carlos Eduardo Ramírez López" },
	{ id: "3", nombre: "Ana Sofía Martínez Pérez" },
	{ id: "4", nombre: "Roberto Jiménez Vega" },
	{ id: "5", nombre: "Lucía Fernández Castro" },
	{ id: "6", nombre: "Diego Morales Ríos" },
	{ id: "7", nombre: "Valentina Cruz Mendoza" },
	{ id: "8", nombre: "Andrés Torres Guzmán" },
];

const SERVICIO_PRECIOS: Record<TipoServicio, number> = {
	Consulta: 350,
	Estudio: 800,
};

const PAGOS_INICIALES: Pago[] = [
	{ id: "PAG-001", idRecibo: "REC-2026-0001", monto: 2000.0, metodoPago: "transferencia", fechaPago: "2026-03-14" },
	{ id: "PAG-002", idRecibo: "REC-2026-0001", monto: 1540.0, metodoPago: "efectivo", fechaPago: "2026-03-20" },
	{ id: "PAG-003", idRecibo: "REC-2026-0003", monto: 1000.0, metodoPago: "deposito", fechaPago: "2026-03-22" },
	{ id: "PAG-004", idRecibo: "REC-2026-0006", monto: 800.0, metodoPago: "tarjeta", fechaPago: "2026-03-30" },
	{ id: "PAG-005", idRecibo: "REC-2026-0007", monto: 850.0, metodoPago: "efectivo", fechaPago: "2026-04-02" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delayMs: number) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = window.setTimeout(() => setDebounced(value), delayMs);
		return () => window.clearTimeout(t);
	}, [value, delayMs]);
	return debounced;
}

// ─── Payment method selector ──────────────────────────────────────────────────

function MetodoPagoSelector({
	value,
	onChange,
}: {
	value: MetodoPago;
	onChange: (m: MetodoPago) => void;
}) {
	return (
		<div className="grid grid-cols-4 gap-2">
			{METODOS_PAGO.map((m) => {
				const isSelected = value === m.id;
				return (
					<button
						key={m.id}
						type="button"
						onClick={() => onChange(m.id)}
						className={cn(
							"flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70",
							isSelected
								? "border-slate-600 bg-slate-100"
								: "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100",
						)}
					>
						<span
							className={cn(
								"flex h-7 w-7 items-center justify-center rounded-full",
								isSelected ? "bg-slate-600 text-white" : "bg-slate-200 text-slate-600",
							)}
						>
							{m.icon}
						</span>
						<span className="text-xs font-medium text-slate-800">{m.nombre}</span>
					</button>
				);
			})}
		</div>
	);
}

// ─── Registrar pago modal ─────────────────────────────────────────────────────

function RegistrarPagoModal({
	recibo,
	pagos,
	onRegistrar,
	onClose,
}: {
	recibo: Recibo | null;
	pagos: Pago[];
	onRegistrar: (monto: number, metodo: MetodoPago) => void;
	onClose: () => void;
}) {
	const saldoPendiente = recibo
		? Math.round((recibo.montoTotal - recibo.montoPagado) * 100) / 100
		: 0;

	const [amount, setAmount] = useState("");
	const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setMetodo("efectivo");
		setError(null);
	}, [recibo?.id]);

	useEffect(() => {
		if (recibo) setAmount(saldoPendiente.toFixed(2));
	}, [saldoPendiente, recibo?.id]);

	function handleSubmit() {
		const parsed = parseFloat(amount);
		if (isNaN(parsed) || parsed <= 0) {
			setError("El monto debe ser mayor a cero.");
			return;
		}
		const rounded = Math.round(parsed * 100) / 100;
		if (rounded > saldoPendiente) {
			setError(`El monto supera el saldo pendiente (${formatCurrency(saldoPendiente)}).`);
			return;
		}
		onRegistrar(rounded, metodo);
		setError(null);
	}

	const historial = pagos
		.filter((p) => Number(p.idRecibo) === Number(recibo?.id))
		.slice()
		.reverse();

	return (
		<Modal
			open={recibo !== null}
			onClose={onClose}
			title="Registrar pago"
			titleId="registrar-pago-title"
		>
			{recibo && (
				<>
					<div className="grid grid-cols-3 gap-4 bg-slate-50 px-5 py-4">
						<div>
							<p className="text-xs uppercase text-slate-400">Total</p>
							<p className="text-sm font-semibold text-slate-800">
								{formatCurrency(recibo.montoTotal)}
							</p>
						</div>
						<div>
							<p className="text-xs uppercase text-slate-400">Pagado</p>
							<p className="text-sm font-semibold text-slate-800">
								{formatCurrency(recibo.montoPagado)}
							</p>
						</div>
						<div>
							<p className="text-xs uppercase text-slate-400">Saldo</p>
							<p className="text-sm font-semibold text-slate-800">
								{formatCurrency(saldoPendiente)}
							</p>
						</div>
					</div>

					<div className="space-y-4 px-5 py-4">
						<div>
							<label className="mb-1 block text-xs font-medium text-slate-600">
								Monto
							</label>
							<Input
								type="number"
								min="0.01"
								step="0.01"
								value={amount}
								onChange={(e) => {
									setAmount(e.target.value);
									setError(null);
								}}
								className={error ? "border-red-300 ring-2 ring-red-400/70" : ""}
							/>
							{error && <p className="mt-1 text-xs text-red-600">{error}</p>}
						</div>
						<div>
							<p className="mb-2 text-xs font-medium text-slate-600">Método de pago</p>
							<MetodoPagoSelector value={metodo} onChange={setMetodo} />
						</div>
					</div>

					<div className="border-t border-slate-100 px-5 pb-4">
						<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
							Historial de pagos
						</p>
						{historial.length === 0 ? (
							<p className="text-sm text-slate-400">Sin pagos registrados.</p>
						) : (
							<ul className="space-y-2">
								{historial.map((p) => (
									<li key={p.id} className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
												<Check className="h-3 w-3" />
											</span>
											<span className="font-medium text-slate-800">
												{formatCurrency(p.monto)}
											</span>
											<span className="text-slate-500">
												{METODO_LABELS[p.metodoPago]}
											</span>
										</div>
										<span className="text-slate-400">{formatDate(p.fechaPago)}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
						<Button variant="ghost" onClick={onClose}>
							Cancelar
						</Button>
						<Button
							variant="primary"
							onClick={handleSubmit}
							disabled={saldoPendiente <= 0}
						>
							Registrar pago
						</Button>
					</div>
				</>
			)}
		</Modal>
	);
}

// ─── Desglose modal ───────────────────────────────────────────────────────────

function DesgloseModal({
	recibo,
	onClose,
}: {
	recibo: Recibo | null;
	onClose: () => void;
}) {

	const productos = recibo?.productos ?? [];
	const subtotoBruto = productos.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);
	const tieneDescuento = (recibo?.descuentoPct ?? 0) > 0;

	return (
		<Modal
			open={recibo !== null}
			onClose={onClose}
			title={recibo ? `Desglose — REC-${recibo.id}` : "Desglose"}
			titleId="desglose-title"
			className="max-w-2xl"
		>
			{recibo && (
				<>
					<div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-slate-50 px-5 py-4 text-sm">
						<div>
							<span className="font-medium text-slate-600">Asociado: </span>
							<span className="text-slate-800">{recibo.asociado}</span>
						</div>
						<div>
							<span className="font-medium text-slate-600">Fecha: </span>
							<span className="text-slate-800">{formatDate(recibo.fechaEmision)}</span>
						</div>
						<div>
							<span className="font-medium text-slate-600">Tipo de paciente: </span>
							<span className="text-slate-800">Tipo {recibo.tipoPaciente}</span>
							{tieneDescuento && (
								<span className="ml-1.5 text-xs text-amber-600">
									({recibo.descuentoPct}% desc.)
								</span>
							)}
						</div>
						<div>
							<span className="font-medium text-slate-600">Total: </span>
							<span
								className={cn(
									"font-semibold",
									recibo.montoTotal === 0 ? "text-red-600" : "text-slate-800",
								)}
							>
								{formatCurrency(recibo.montoTotal)}
							</span>
						</div>
					</div>

					{productos.length === 0 ? (
						<div className="px-5 py-10 text-center text-sm text-slate-400">
							Este recibo no tiene productos desglosados.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
										<th className="px-5 py-3 text-left">Producto</th>
										<th className="px-5 py-3 text-right">Cant.</th>
										<th className="px-5 py-3 text-right">Precio unit.</th>
										<th className="px-5 py-3 text-right">Subtotal</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{productos.map((p, i) => (
										<tr key={i} className="text-sm">
											<td className="px-5 py-3 font-medium text-slate-800">
												{p.itemName}
											</td>
											<td className="px-5 py-3 text-right text-slate-600">
												{p.cantidad}
											</td>
											<td className="px-5 py-3 text-right text-slate-600">
												{formatCurrency(p.precioUnitario)}
											</td>
											<td className="px-5 py-3 text-right font-semibold text-slate-800">
												{formatCurrency(p.cantidad * p.precioUnitario)}
											</td>
										</tr>
									))}
								</tbody>
								<tfoot>
									{tieneDescuento && (
										<>
											<tr className="border-t border-slate-200">
												<td
													colSpan={3}
													className="px-5 py-2 text-right text-sm text-slate-500"
												>
													Subtotal
												</td>
												<td className="px-5 py-2 text-right text-sm text-slate-500">
													{formatCurrency(subtotoBruto)}
												</td>
											</tr>
											<tr>
												<td
													colSpan={3}
													className="px-5 py-2 text-right text-sm text-amber-600"
												>
													Descuento Tipo {recibo.tipoPaciente} ({recibo.descuentoPct}%)
												</td>
												<td className="px-5 py-2 text-right text-sm text-amber-600">
													-{formatCurrency(subtotoBruto * recibo.descuentoPct / 100)}
												</td>
											</tr>
										</>
									)}
									<tr className="border-t-2 border-slate-300">
										<td
											colSpan={3}
											className="px-5 py-3 text-right text-sm font-semibold text-slate-700"
										>
											Total
										</td>
										<td className="px-5 py-3 text-right text-sm font-bold text-slate-900">
											{formatCurrency(recibo.montoTotal)}
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					)}

					<div className="flex justify-end border-t border-slate-100 px-5 py-4">
						<Button variant="ghost" onClick={onClose}>
							Cerrar
						</Button>
					</div>
				</>
			)}
		</Modal>
	);
}

// ─── Recibo detail modal ────────────────────────────────────────────────────

function ReciboDetailModal({
	recibo,
	pagos,
	onClose,
}: {
	recibo: Recibo | null;
	pagos: any;
	onClose: () => void;
}) {

	useEffect(()=>{
		console.log(recibo)
	},[recibo])

	const [consultaItems, setConsultaItems] = useState<any[]>([]);
	const [estudioItems, setEstudioItems] = useState<any[]>([]);
	const [movements, setMovements] = useState<InventoryMovement[]>([]);
	const [movementsLoading, setMovementsLoading] = useState(false);
	const [movementsError, setMovementsError] = useState<string | null>(null);
	const [detailConsultas, setDetailConsultas] = useState<any[]>([]);
	const [detailEstudios, setDetailEstudios] = useState<any[]>([]);
	const [serviciosLoading, setServiciosLoading] = useState(false);
	const [serviciosError, setServiciosError] = useState<string | null>(null);

	

	const currentReciboId = recibo?.reciboId ?? recibo?.id ?? null;

	useEffect(() => {
		if (!currentReciboId) {
			setMovements([]);
			setMovementsError(null);
			setMovementsLoading(false);
			return;
		}

		let alive = true;
		setMovementsLoading(true);
		setMovementsError(null);

		listMovements({ reciboId: currentReciboId, limit: 50 })
			.then((res) => {
				if (!alive) return;
				setMovements(res.items);
			})
			.catch((error) => {
				if (!alive) return;
				setMovements([]);
				setMovementsError(
					error instanceof Error
						? error.message
						: "No se pudieron cargar los movimientos.",
				);
			})
			.finally(() => {
				if (!alive) return;
				setMovementsLoading(false);
			});

		return () => {
			alive = false;
		};
	}, [currentReciboId]);

	useEffect(() => {
		const productos = JSON.parse(JSON.stringify(recibo?.productos ?? []));

		// Derive consultas / estudios directly from the recibo productos
		const consultaItems = productos.filter((p: any) => String(p?.tipo ?? "").toLowerCase().includes("consulta"));
		setConsultaItems(consultaItems);

		const estudioItems = productos.filter((p: any) => String(p?.tipo ?? "").toLowerCase().includes("estudio"));
		setEstudioItems(estudioItems);

		// we derive items immediately from the recibo; don't keep serviciosLoading stuck
		setServiciosLoading(false);
	}, [recibo]);

	const consultaPriceLookup = useMemo(() => {
		const map = new Map<number, number>();
		detailConsultas.forEach((c: any) => {
			const id = Number(c?.id_consulta);
			const aportacion = Number(c?.aportacion);
			if (Number.isFinite(id) && Number.isFinite(aportacion)) {
				map.set(id, aportacion);
			}
		});
		return map;
	}, [detailConsultas]);

	const estudioPriceLookup = useMemo(() => {
		const map = new Map<number, number>();
		detailEstudios.forEach((e: any) => {
			const id = Number(e?.id_estudio);
			const aportacion = Number(e?.aportacion);
			if (Number.isFinite(id) && Number.isFinite(aportacion)) {
				map.set(id, aportacion);
			}
		});
		return map;
	}, [detailEstudios]);

	type MetodoPago =
	| "efectivo"
	| "transferencia"
	| "depósito"
	| "tarjeta";

	type Pago = {
	id?: number;
	fecha: string;
	monto: number;
	metodo: MetodoPago;
	};

	type Producto = {
	itemId: number;
	itemName: string;
	cantidad: number;
	precioUnitario: number;
	tipo: "Consulta" | "Estudio" | "Inventario";
	};

	type Recibo = {
	id: number;
	reciboId?: number;
	asociado: string;
	fechaEmision: string;
	fechaLimite: string;
	montoTotal: number;
	montoPagado: number;
	tipoPaciente: "urbano" | "rural";
	descuentoPct?: number;
	descuentoMonto?: number;
	exencionMonto?: number;
	productos?: Producto[] | null;
	pagos?: Pago[];
	};

	function normalizeRecibo(raw: any) {
		const productos = (raw.productos ?? [])
			.filter(Boolean)
			.map((p: any) => ({
			itemId: Number(p.itemId),
			itemName: p.itemName ?? "Sin nombre",
			cantidad: Number(p.cantidad ?? 1),
			precioUnitario: Number(p.precioUnitario ?? 0),
			tipo: p.tipo ?? "Inventario",
			}));

		const subtotal = productos.reduce(
			(acc: any, p: any) => acc + p.cantidad * p.precioUnitario,
			0
		);

		const descuento =
			raw.descuentoMonto ??
			subtotal * ((raw.descuentoPct ?? 0) / 100);

		const exencion = raw.exencionMonto ?? 0;

		const total = subtotal - descuento - exencion;

		const montoPagado = Number(raw.montoPagado ?? 0);

		const saldoPendiente = Math.max(total - montoPagado, 0);

		const pagosRecibo = pagos.filter((e:any) => {
			return e.idRecibo == raw.id
		})
		.map((e: any) => {
			if (e == null) return;
			return {
				id: e.id,
				fecha: e.fechaPago,
				monto: e.monto,
				metodo: e.metodoPago
			}
		})

		const estatus =
			saldoPendiente <= 0 ? "Pagado" : "Pendiente";

		

		return {
			id: raw.id,
			reciboId: raw.reciboId,
			asociado: raw.asociado,
			fechaEmision: raw.fechaEmision,
			fechaLimite: raw.fechaLimite,

			tipoPaciente: raw.tipoPaciente,

			productos,

			pagos: pagosRecibo ?? [],

			// cálculos consistentes
			subtotal,
			descuento,
			exencion,
			montoTotal: total,
			montoPagado,
			saldoPendiente,
			estatus,
		};
	}

	const [imprimirData, setImprimirData] = useState<Recibo|null>(null);
	useEffect(()=>{
		if (recibo){
			setImprimirData(normalizeRecibo(recibo))
		}
	},[recibo])
	

	const componentRef = useRef<HTMLDivElement>(null);

	const handlePrint = useReactToPrint({
		contentRef: componentRef,
	});

	const estatus = recibo ? derivarEstatus(recibo) : "Pendiente";
	const saldoPendiente = recibo
		? Math.max(0, Math.round((recibo.montoTotal - recibo.montoPagado) * 100) / 100)
		: 0;

	return (
		<Modal
			open={recibo !== null}
			onClose={onClose}
			title={recibo ? `Detalle de recibo REC-${recibo.id}` : "Detalle de recibo"}
			titleId="recibo-detail-title"
			className="max-w-5xl overflow-y-auto max-h-[95vh]"
		>
			{recibo && (
				<div className="space-y-4 px-5 py-4">
					<div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
						<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
							Datos generales
						</p>
						<div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
							<div>
								<p className="text-xs uppercase text-slate-400">Recibo</p>
								<p className="font-medium text-slate-800">REC-{recibo.id}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Asociado</p>
								<p className="font-medium text-slate-800">{recibo.asociado}</p>
							</div>
							<div />
							<div>
								<p className="text-xs uppercase text-slate-400">Fecha emision</p>
								<p className="text-slate-800">{formatDate(recibo.fechaEmision)}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Fecha limite</p>
								<p className="text-slate-800">
									{recibo.fechaLimite ? formatDate(recibo.fechaLimite) : "—"}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Estatus</p>
								<p className={cn("font-medium", ESTATUS_AMOUNT_CLASS[estatus])}>
									{estatus}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Tipo paciente</p>
								<p className="text-slate-800">Tipo {recibo.tipoPaciente}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Descuento</p>
								<p className="text-slate-800">{recibo.descuentoPct}%</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Exento</p>
								<p className="text-slate-800">{recibo.exento ? "Si" : "No"}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Total</p>
								<p className="font-medium text-slate-800">
									{formatCurrency(recibo.montoTotal)}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Pagado</p>
								<p className="font-medium text-slate-800">
									{formatCurrency(recibo.montoPagado)}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-slate-400">Saldo</p>
								<p className="font-medium text-slate-800">
									{formatCurrency(saldoPendiente)}
								</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								Consultas
							</p>
							{serviciosError ? (
								<p className="text-sm text-rose-700">{serviciosError}</p>
							) : consultaItems.length === 0 ? (
								<p className="text-sm text-slate-400">Sin consultas.</p>
							) : (
								<ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
									{consultaItems.map((item: any) => {
										if (item === undefined || item === null || typeof item !== "object") {
											return null;
										}
										const unitPrice = Number(item?.precioUnitario);
										const lookupPrice = consultaPriceLookup.get(Number(item?.itemId));
										const resolvedPrice =
											Number.isFinite(unitPrice) && unitPrice > 0
												? unitPrice
												: typeof lookupPrice === "number" && Number.isFinite(lookupPrice)
													? lookupPrice
													: 0;
										return (
										<li key={ "CON: " + item.itemId} className="flex items-center justify-between px-4 py-2 text-sm">
											<Link href={`/servicios/${item.itemId}/detalle-consulta`}>
												{item.itemName ? (
													<p className="font-medium text-slate-800">{item.itemName}</p>
												) : null}
												<p className="text-xs text-slate-500">
													{formatCurrency(resolvedPrice)}
												</p>
											</Link>
										</li>
										)
									})}
								</ul>
							)}
						</div>

						<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								Estudios
							</p>
							{serviciosError ? (
								<p className="text-sm text-rose-700">{serviciosError}</p>
							) : estudioItems.length === 0 ? (
								<p className="text-sm text-slate-400">Sin estudios.</p>
							) : (
								<ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
									{estudioItems.map((item: any) => {
										if (item === undefined || item === null || typeof item !== "object") {
											return null;
										}
										const unitPrice = Number(item?.precioUnitario);
										const lookupPrice = estudioPriceLookup.get(Number(item?.itemId));
										const resolvedPrice =
											Number.isFinite(unitPrice) && unitPrice > 0
												? unitPrice
												: typeof lookupPrice === "number" && Number.isFinite(lookupPrice)
													? lookupPrice
													: 0;
										return (
											<li key={item.itemId} className="flex items-center justify-between px-4 py-2 text-sm">
												<Link href={`/servicios/${item.itemId}/detalle-estudio`}>
													{item.itemName ? (
														<p className="font-medium text-slate-800">{item.itemName}</p>
													) : null}
													<p className="text-xs text-slate-500">
														{formatCurrency(resolvedPrice)}
													</p>
												</Link>
											</li>
										)
									})}
								</ul>
							)}
						</div>
					</div>

					<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
						<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
							Movimientos asociados
						</p>
						{!recibo.reciboId ? (
							<p className="text-sm text-slate-400">
								Este recibo no tiene id_recibo asociado.
							</p>
						) : movementsLoading ? (
							<p className="text-sm text-slate-400">Cargando movimientos...</p>
						) : movementsError ? (
							<p className="text-sm text-rose-700">{movementsError}</p>
						) : movements.length === 0 ? (
							<p className="text-sm text-slate-400">Sin movimientos asociados.</p>
						) : (
							<ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
								{movements.map((m) => (
									<li key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
										<div>
											<p className="font-medium text-slate-800">
												{m.itemName}
											</p>
											<p className="text-xs text-slate-500">
												{m.movementType === "in" ? "Entrada" : "Salida"} · {m.quantity} uds · {formatDate(m.date)}
											</p>
											{m.notes ? (
												<p className="text-xs text-slate-400">{m.notes}</p>
											) : null}
										</div>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="flex justify-end mt-6">
						<Button 
						variant="secondary"
						onClick={handlePrint}>
							Imprimir recibo
						</Button>
					</div>

				</div>
			)}

			{ imprimirData ? (
			<div className="hidden">
				<div ref={componentRef}>
					<ImprimirReciboTemplate recibo={imprimirData}></ImprimirReciboTemplate>
				</div>
			</div>) : null
			}

		</Modal>
	);
}

type nuevoRecibo = {
  "id_asociado": number,
  "id_usuario": number,
  "fecha_limite": string,
  "tipo_zona": TipoZona | "",
  "tipo_cuota": string,
  "total": number,
	"descuento": number,
  "total_pagado": number,
  "estatus": string,
  "nota": string
}

const nuevoReciboDefault: nuevoRecibo = {
  "id_asociado": 0,
  "id_usuario": 0,
  fecha_limite: "0000-00-00",
  tipo_zona: "",
  tipo_cuota: "",
  total: 0,
	descuento: 0,
  total_pagado: 0,
  estatus: "",
  nota: ""
};

// ─── Nuevo recibo modal ───────────────────────────────────────────────────────

function NuevoReciboModal({
	open,
	onClose,
	onCrear,
}: {
	open: boolean;
	onClose: () => void;
	onCrear: (r: Recibo) => void;
}) {

	// Servicios y recibos

	const  [listaNuevaConsulta, setListaNuevaConsulta] = useState<any[]>([]);
	const [listaNuevoEstudio, setListaNuevoEstudio] = useState<any[]>([]);
	const [nuevaConsultaModalAbierto, setNuevaConsultaModalAbierto] = useState(false);
	const [nuevoEstudioModalAbierto, setNuevoEstudioModalAbierto] = useState(false);
	const [nuevoRecibo, setNuevoRecibo] = useState(nuevoReciboDefault);

	// Associate state
	const [asociadoSearch, setAsociadoSearch] = useState("");
	const [asociadoSeleccionado, setAsociadoSeleccionado] = useState<AsociadoMini | null>(null);
	const [showAsociadoDropdown, setShowAsociadoDropdown] = useState(false);
	const [asociados, setAsociados] = useState<AsociadoMini[]>([]);
	const [asociadosLoading, setAsociadosLoading] = useState(false);
	const asociadoRef = useRef<HTMLDivElement>(null);

	// Servicio state
	const [servicioChecked, setServicioChecked] = useState(false);
	const [servicios, setServicios] = useState<ReciboServicio[]>([]);
	const [servicioModalOpen, setServicioModalOpen] = useState(false);

	// Inventario state
	const [inventarioChecked, setInventarioChecked] = useState(false);
	const [productos, setProductos] = useState<ReciboProducto[]>([]);
	const [productSearch, setProductSearch] = useState("");
	const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);

	// Movimientos de inventario
	const [movementModalOpen, setMovementModalOpen] = useState(false);
	const [movementItemTypes, setMovementItemTypes] = useState<MovementItemType[]>([]);
	const [draftMovements, setDraftMovements] = useState<DraftMovement[]>([]);
	const [movementSubmitError, setMovementSubmitError] = useState<string | null>(null);

	// Other state
	const [fechaLimite, setFechaLimite] = useState("");
	const [tipoZona, setTipoZona] = useState<TipoZona | "">("");
	const [exento, setExento] = useState(false);
	const [descuentoPct, setDescuentoPct] = useState(0);
	const [creating, setCreating] = useState(false);

	// Computed totals
	const totalServicios = servicios.reduce((s, sv) => s + sv.precio, 0);
	const totalConsultas = listaNuevaConsulta.reduce(
		(s, c) => s + parseMoneyValue(c?.aportacion),
		0,
	);
	const totalEstudios = listaNuevoEstudio.reduce(
		(s, e) => s + parseMoneyValue(e?.aportacion),
		0,
	);
	const totalInventario = productos.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);
	const totalMovimientos = draftMovements.reduce(
		(s, d) => s + d.unitPrice * d.input.quantity,
		0,
	);
	const totalBruto = totalServicios + totalConsultas + totalEstudios + totalInventario + totalMovimientos;
	const descuentoMonto = Math.round(totalBruto * (descuentoPct / 100) * 100) / 100;
	const totalFinal = exento ? 0 : Math.round((totalBruto - descuentoMonto) * 100) / 100;
	const hasEstudio = servicios.some((s) => s.tipo === "Estudio") || listaNuevoEstudio.length > 0;
	const asociadoSeleccionadoId = getAsociadoNumericId(asociadoSeleccionado);
	const defaultFolioConsultaEstudio = useMemo(() => {
		if (asociadoSeleccionadoId == null) return undefined;

		const consultasDelAsociado = listaNuevaConsulta
			.map((consulta) => consulta?.data ?? consulta)
			.filter((consulta) => Number(consulta?.id_asociado) === asociadoSeleccionadoId);
		const latest = consultasDelAsociado[consultasDelAsociado.length - 1];
		const ref = latest
			? String(latest?.id_consulta_local ?? latest?.id_consulta ?? latest?.folio ?? "")
			: "";

		return ref || undefined;
	}, [asociadoSeleccionadoId, listaNuevaConsulta]);

	const filteredAsociados = useMemo(() => {
		const q = asociadoSearch.trim().toLowerCase();
		if (!q) return asociados.slice(0, 8);
		return asociados
			.filter((a) => a.nombre.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
			.slice(0, 8);
	}, [asociados, asociadoSearch]);

	useEffect(() => {
		if (!open) return;
		if (movementItemTypes.length > 0) return;
		let alive = true;
		listMovementItemTypes()
			.then((types) => { if (alive) setMovementItemTypes(types); })
			.catch(() => {});
		return () => { alive = false; };
	}, [open, movementItemTypes.length]);

	useEffect(() => {
		if (!productSearch.trim()) {
			setSearchResults([]);
			setShowDropdown(false);
			return;
		}
		setSearchLoading(true);
		const t = window.setTimeout(async () => {
			try {
				const results = await searchInventoryItemsByName(productSearch, 6);
				setSearchResults(results);
				setShowDropdown(results.length > 0);
			} catch {
				setSearchResults([]);
				setShowDropdown(false);
			} finally {
				setSearchLoading(false);
			}
		}, 350);
		return () => window.clearTimeout(t);
	}, [productSearch]);

	useEffect(() => {
		async function getAsociados(){
			const res = await fetch("/api/asociados/lista_asociados/mini");
			if (res.ok){
				const data = await res.json();
				
				const asociadosReducidos = data.map((e: any) => {
					return ({
						id: "ASC-" + e.id_asociado,
						nombre: e.nombre + " " + e.apellidos
					})
				})

				setAsociados(asociadosReducidos);
			}
		}
		getAsociados()
	}, [])

	useEffect(() => {
		function handler(e: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	useEffect(() => {
		function handler(e: MouseEvent) {
			if (asociadoRef.current && !asociadoRef.current.contains(e.target as Node)) {
				setShowAsociadoDropdown(false);
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const resetState = useCallback(() => {
		setAsociadoSearch("");
		setAsociadoSeleccionado(null);
		setShowAsociadoDropdown(false);
		setServicioChecked(false);
		setServicios([]);
		setServicioModalOpen(false);
		setListaNuevaConsulta([]);
		setListaNuevoEstudio([]);
		setNuevaConsultaModalAbierto(false);
		setNuevoEstudioModalAbierto(false);
		setNuevoRecibo(nuevoReciboDefault);
		setInventarioChecked(false);
		setProductos([]);
		setProductSearch("");
		setSearchResults([]);
		setShowDropdown(false);
		setFechaLimite("");
		setTipoZona("");
		setExento(false);
		setDescuentoPct(0);
		setCreating(false);
		setMovementModalOpen(false);
		setDraftMovements([]);
		setMovementSubmitError(null);
		onClose();
	}, [onClose]);

	const handleClose = useCallback(() => {
		if (draftMovements.length > 0) {
			const ok = window.confirm(
				"Tienes movimientos de inventario pendientes. Si cierras este recibo se perderan.",
			);
			if (!ok) return;
		}
		resetState();
	}, [draftMovements.length, resetState]);

	function addServicio(tipo: TipoServicio) {
		setServicios((prev) => [...prev, { tipo, precio: SERVICIO_PRECIOS[tipo] }]);
		setServicioModalOpen(false);
	}

	function removeServicio(index: number) {
		setServicios((prev) => prev.filter((_, i) => i !== index));
	}

	function addProduct(item: InventoryItem) {
		setProductos((prev) => {
			const existing = prev.find((p) => p.itemId === item.id);
			if (existing) {
				return prev.map((p) =>
					p.itemId === item.id ? { ...p, cantidad: p.cantidad + 1 } : p,
				);
			}
			return [
				...prev,
				{
					itemId: item.id,
					itemName: item.name,
					cantidad: 1,
					precioUnitario: item.cuotaRecuperacion ?? 0,
				},
			];
		});
		setProductSearch("");
		setSearchResults([]);
		setShowDropdown(false);
	}

	function removeProduct(index: number) {
		setProductos((prev) => prev.filter((_, i) => i !== index));
	}

	function updateProducto(index: number, field: "cantidad" | "precioUnitario", raw: string) {
		const parsed = field === "cantidad" ? parseInt(raw, 10) : parseFloat(raw);
		const value = isNaN(parsed) || parsed < 0 ? 0 : parsed;
		setProductos((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
	}

	function removeDraftMovement(id: string) {
		setDraftMovements((prev) => prev.filter((draft) => draft.id !== id));
	}

	function removeConsulta(index: number) {
		setListaNuevaConsulta((prev) => prev.filter((_, i) => i !== index));
	}

	function removeEstudio(index: number) {
		setListaNuevoEstudio((prev) => prev.filter((_, i) => i !== index));
	}

	function getConsultaRefId(consulta: any, index: number) {
		return String(consulta?.id_consulta_local ?? consulta?.folio ?? `consulta-${index}`);
	}

	function getConsultaLabel(consulta: any, index: number) {
		const tipo = consulta?.tipo_consulta;
		if (tipo) return `Consulta ${tipo}`;
		const ref = getConsultaRefId(consulta, index);
		return ref ? `Consulta ${ref}` : `Consulta ${index + 1}`;
	}

	function getEstudioLabel(estudio: any, index: number) {
		return estudio?.id_tipo_estudio
			? `Estudio #${estudio.id_tipo_estudio}`
			: `Estudio ${index + 1}`;
	}

	function consultaTieneEstudio(consulta: any, index: number) {
		const refId = getConsultaRefId(consulta, index);
		if (!refId) return false;
		return listaNuevoEstudio.some((e) => String(e?.id_consulta ?? e?.id_consulta_local ?? "") === refId);
	}

	function handleMovementDraft(payload: { input: CreateMovementInput; unitPrice: number }) {
		setDraftMovements((prev) => [
			{ id: createDraftId(), input: payload.input, unitPrice: payload.unitPrice },
			...prev,
		]);
		setMovementSubmitError(null);
		setMovementModalOpen(false);
	}

	async function handleCrear() {
		if (!asociadoSeleccionado || !fechaLimite) return;
		if (!tipoZona) {
			alert("Selecciona si el recibo es urbano o rural.");
			return;
		}
		setCreating(true);
		setMovementSubmitError(null);

		const id = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
		const fechaHoy = new Date().toISOString().split("T")[0];

		const serviciosComoProductos: ReciboProducto[] = servicios.map((s) => ({
			itemId: null,
			itemName: s.tipo,
			cantidad: 1,
			precioUnitario: s.precio,
		}));
		const consultaProductos: ReciboProducto[] = listaNuevaConsulta.map((c, i) => ({
			itemId: null,
			itemName: c?.tipo_consulta
				? `Consulta ${c.tipo_consulta}`
				: c?.id_consulta_local
					? `Consulta ${c.id_consulta_local}`
					: `Consulta ${i + 1}`,
			cantidad: 1,
			precioUnitario: parseMoneyValue(c?.aportacion),
		}));
		const estudioProductos: ReciboProducto[] = listaNuevoEstudio.map((e, i) => ({
			itemId: null,
			itemName: e?.id_tipo_estudio ? `Estudio #${e.id_tipo_estudio}` : `Estudio ${i + 1}`,
			cantidad: 1,
			precioUnitario: parseMoneyValue(e?.aportacion),
		}));

		const session = await getSession();
		const asociadoId = getAsociadoNumericId(asociadoSeleccionado);

		const reciboActualizado: nuevoRecibo = {
			id_asociado: asociadoId ?? 0,
			id_usuario: Number((session?.user as any).id ?? 0),
			fecha_limite: fechaLimite,
			tipo_zona: tipoZona,
			tipo_cuota: exento ? "exento" : "cuota",
			total: totalFinal,
			descuento: descuentoPct,
			total_pagado: 0,
			estatus: "no_pagado",
			nota: "",
		};

		setNuevoRecibo(reciboActualizado);

		let id_recibo: number | null = null;
		try {
			const resRecibo = await fetch('/api/recibos/nuevo',{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(reciboActualizado)
			});

			const reciboData = await resRecibo.json();
			const parsedId = Number(reciboData?.id_recibo ?? 0);
			if (!resRecibo.ok || reciboData?.status !== "Success" || !parsedId) {
				throw new Error(reciboData?.message ?? "No se pudo crear el recibo.");
			}
			id_recibo = parsedId;
		} catch (error) {
			setMovementSubmitError(
				error instanceof Error
					? error.message
					: "No se pudo crear el recibo.",
			);
			setCreating(false);
			return;
		}

		const consultasConRecibo = listaNuevaConsulta.map((c) => {
			const idAsociado = Number(c?.id_asociado ?? asociadoId ?? 0);
			const idMedico = Number(c?.id_medico ?? 0);
			return {
				...c,
				id_recibo,
				id_asociado: Number.isFinite(idAsociado) ? idAsociado : 0,
				id_medico: Number.isFinite(idMedico) ? idMedico : 0,
				aportacion: parseMoneyValue(c?.aportacion),
				ya_aporto: c?.ya_aporto ? 1 : 0,
				estatus: "Pendiente",
			};
		});
		const estudiosConRecibo = listaNuevoEstudio.map((e) => {
			const idAsociado = Number(e?.id_asociado ?? asociadoId ?? 0);
			const idTipoEstudio = Number(e?.id_tipo_estudio ?? 0);
			return {
				...e,
				id_recibo,
				id_asociado: Number.isFinite(idAsociado) ? idAsociado : 0,
				id_tipo_estudio: Number.isFinite(idTipoEstudio) ? idTipoEstudio : 0,
				aportacion: parseMoneyValue(e?.aportacion),
				ya_aporto: e?.ya_aporto ? 1 : 0,
			};
		});

		const resServicios = await fetch('/api/recibos/agregarServicios', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'            
			},
			body: JSON.stringify({
				consultas: consultasConRecibo,
				estudios: estudiosConRecibo
			})
		});

		const serviciosData = await resServicios.json().catch(() => null);
		if (resServicios.ok && serviciosData?.message === "Success"){
			setListaNuevaConsulta([]);
			setListaNuevoEstudio([]);
		} else {
			const error = serviciosData?.error ? `\n\nError: ${serviciosData.error}` : "";
			const detail = serviciosData?.details
				? `\n\nDetalle: ${
					typeof serviciosData.details === "string"
						? serviciosData.details
						: JSON.stringify(serviciosData.details, null, 2)
				}`
				: "";
			alert(`Error al agregar servicios${error}${detail}`);
			setCreating(false);
			return;
		}

		onCrear({
			id: Number(id),
			reciboId: id_recibo,
			asociado: asociadoSeleccionado.nombre,
			fechaEmision: fechaHoy,
			fechaLimite,
			montoTotal: totalFinal,
			montoPagado: 0,
			tipoPaciente: "A",
			descuentoPct,
			productos: [
				...serviciosComoProductos,
				...consultaProductos,
				...estudioProductos,
				...productos,
			],
			exento,
			servicios,
			consultas: consultasConRecibo,
			estudios: estudiosConRecibo,
		});

		if (draftMovements.length > 0) {
			try {
				for (const draft of draftMovements) {
					await createMovement({ ...draft.input, reciboId: id_recibo });
				}
			} catch (error) {
				setMovementSubmitError(
					error instanceof Error
						? error.message
						: "No se pudieron registrar los movimientos pendientes.",
				);
			}
		}
		for (const prod of productos) {
			if (prod.itemId !== null && prod.cantidad > 0) {
				fetch("/api/inventario/movimientos/agregar", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						itemId: prod.itemId,
						movementType: "out",
						date: fechaHoy,
						quantity: prod.cantidad,
						notes: `Salida por recibo ${id}`,
						reciboId: id_recibo,
					}),
				}).catch(console.error);
			}
		}

		resetState();

		window.location.reload()

	}

	const canCrear = asociadoSeleccionado !== null && fechaLimite.length > 0;

	return (
		<>
			<Modal
				open={open}
				onClose={handleClose}
				title="Nuevo recibo"
				titleId="nuevo-recibo-title"
				className="flex max-h-[90dvh] max-w-4xl flex-col"
			>
				<div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-6">

				{/* ── Asociado ── */}
				<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
					<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
						Asociado
					</p>
					<div ref={asociadoRef} className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						{asociadosLoading && (
							<Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
						)}
						<Input
							className="pl-9 pr-9"
							placeholder="Buscar por nombre, ID o CURP…"
							value={asociadoSearch}
							onChange={(e) => {
								setAsociadoSearch(e.target.value);
								setAsociadoSeleccionado(null);
								setShowAsociadoDropdown(true);
							}}
							onFocus={() => setShowAsociadoDropdown(true)}
						/>
						{showAsociadoDropdown && filteredAsociados.length > 0 && (
							<ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
								{filteredAsociados.map((a) => (
									<li key={a.id}>
										<button
											type="button"
											className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
											onClick={() => {
												setAsociadoSeleccionado(a);
												setAsociadoSearch(a.nombre);
												setShowAsociadoDropdown(false);
											}}
										>
											<span className="font-medium text-slate-800">{a.nombre}</span>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
					{asociadoSeleccionado && (
						<div className="mt-3 rounded-lg bg-slate-100 px-4 py-3">
							<p className="font-medium text-slate-800">{asociadoSeleccionado.nombre}</p>
							<p className="mt-0.5 text-xs text-slate-500">ID: {asociadoSeleccionado.id}</p>
						</div>
					)}
				</div>

				{/* ── Servicio ── */}
				<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
					<label className="flex cursor-pointer select-none items-center gap-2.5">
						<input
							type="checkbox"
							checked={servicioChecked}
							onChange={(e) => {
								setServicioChecked(e.target.checked);
								if (!e.target.checked) {
									setServicios([]);
									setServicioModalOpen(false);
								}
							}}
							className="h-4 w-4 rounded border-slate-300 accent-slate-600"
						/>
						<span className="text-sm font-semibold text-slate-700">Servicio</span>
					</label>

					{servicioChecked && (
						<div className="mt-3 space-y-3">
							{hasEstudio && (
								<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
									<AlertTriangle className="h-4 w-4 shrink-0" />
									Estudio incluido — requiere seguimiento
								</div>
							)}

							<button
								type="button"
								onClick={() => setServicioModalOpen(true)}
								className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline-none"
							>
								<Plus className="h-4 w-4" />
								Agregar servicio
							</button>
							{(listaNuevaConsulta.length > 0 || listaNuevoEstudio.length > 0) && (
								<ul className="space-y-2 text-xs">
									{listaNuevaConsulta.map((consulta, index) => {
										const locked = consultaTieneEstudio(consulta, index);
										return (
											<li
												key={`consulta-${index}`}
												className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
											>
												<span className="font-medium text-slate-700">
													{getConsultaLabel(consulta, index)}
												</span>
												<button
													type="button"
													onClick={() => !locked && removeConsulta(index)}
													disabled={locked}
													title={locked ? "Elimina el estudio primero" : "Eliminar consulta"}
													className={cn(
														"rounded-full p-1 text-slate-400 transition focus-visible:outline-none",
														locked
															? "cursor-not-allowed opacity-50"
															: "hover:bg-red-50 hover:text-red-600",
													)}
													aria-label="Eliminar consulta"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</li>
										);
									})}
									{listaNuevoEstudio.map((estudio, index) => (
										<li
											key={`estudio-${index}`}
											className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
										>
											<span className="font-medium text-slate-700">
												{getEstudioLabel(estudio, index)}
											</span>
											<button
												type="button"
												onClick={() => removeEstudio(index)}
												className="rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none"
												aria-label="Eliminar estudio"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</li>
									))}
								</ul>
							)}
							</div>
						)}
					</div>

					{/* ── Inventario ── */}
					<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
						<label className="flex cursor-pointer select-none items-center gap-2.5">
							<input
								type="checkbox"
								checked={inventarioChecked}
								onChange={(e) => {
									setInventarioChecked(e.target.checked);
									if (!e.target.checked) {
										setProductos([]);
										setProductSearch("");
										setSearchResults([]);
										setShowDropdown(false);
										}
									}}
									className="h-4 w-4 rounded border-slate-300 accent-slate-600"
								/>
							<span className="text-sm font-semibold text-slate-700">Inventario</span>
						</label>

					{inventarioChecked && (
						<div className="mt-3 space-y-3">
							{productos.length > 0 && (
								<div className="overflow-x-auto rounded-xl border border-slate-200">
									<table className="w-full border-collapse text-sm">
										<thead>
											<tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
												<th className="px-4 py-2.5 text-left">Producto</th>
												<th className="px-4 py-2.5 text-right">Cant.</th>
												<th className="px-4 py-2.5 text-right">Precio unit.</th>
												<th className="px-4 py-2.5 text-right">Subtotal</th>
												<th className="px-4 py-2.5" />
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100">
											{productos.map((p, i) => (
												<tr key={i}>
													<td className="px-4 py-2 font-medium text-slate-800">
														{p.itemName}
													</td>
													<td className="px-4 py-2 text-right">
														<Input
															type="number"
															min="1"
															step="1"
															value={p.cantidad === 0 ? "" : String(p.cantidad)}
															onChange={(e) => updateProducto(i, "cantidad", e.target.value)}
															className="w-20 text-right"
														/>
													</td>
													<td className="px-4 py-2 text-right">
														<Input
															type="number"
															min="0"
															step="10"
															value={p.precioUnitario === 0 ? "" : String(p.precioUnitario)}
															onChange={(e) => updateProducto(i, "precioUnitario", e.target.value)}
															className="w-28 text-right"
														/>
													</td>
													<td className="px-4 py-2 text-right font-semibold text-slate-800">
														{formatCurrency(p.cantidad * p.precioUnitario)}
													</td>
													<td className="px-4 py-2 text-right">
														<button
															type="button"
															onClick={() => removeProduct(i)}
															className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
															aria-label="Eliminar producto"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							<button
								type="button"
								onClick={() => setMovementModalOpen(true)}
								className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline-none"
							>
								<Plus className="h-4 w-4" />
								Agregar inventario
							</button>
							{draftMovements.length > 0 && (
								<ul className="space-y-2 text-xs">
									{draftMovements.map((draft) => (
										<li
											key={draft.id}
											className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
										>
											<span className="font-medium text-slate-700">
												{draft.input.movementType === "in" ? "Entrada" : "Salida"} · {draft.input.quantity} uds · {draft.input.itemName || "Articulo"}
											</span>
											<button
												type="button"
												onClick={() => removeDraftMovement(draft.id)}
												className="rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none"
												aria-label="Quitar movimiento"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
									</li>
								))}
							</ul>
							)}
						</div>
					)}
				</div>

				{/* ── Urbano / Rural ── */}
				<div className="space-y-2 px-1">
					<p id="tipo-zona-label" className="text-xs font-medium text-slate-600">
						Zona
					</p>
					<div
						role="radiogroup"
						aria-labelledby="tipo-zona-label"
						aria-required="true"
						className="flex gap-5"
					>
						<label className="flex cursor-pointer select-none items-center gap-2">
							<input
								type="radio"
								name="zona"
								value="urbano"
								checked={tipoZona === "urbano"}
								onChange={() => setTipoZona("urbano")}
								className="h-4 w-4 border-slate-300 accent-slate-600"
							/>
							<span className="text-sm text-slate-700">Urbano</span>
						</label>
						<label className="flex cursor-pointer select-none items-center gap-2">
							<input
								type="radio"
								name="zona"
								value="rural"
								checked={tipoZona === "rural"}
								onChange={() => setTipoZona("rural")}
								className="h-4 w-4 border-slate-300 accent-slate-600"
							/>
							<span className="text-sm text-slate-700">Rural</span>
						</label>
					</div>
				</div>

				{/* ── Fecha Límite ── */}
				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Fecha limite para pagar recibo
					</label>
					<Input
						type="date"
						value={fechaLimite}
						onChange={(e) => setFechaLimite(e.target.value)}
					/>
				</div>

				{/* ── Exento ── */}
				<div className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/70">
					<label className="flex cursor-pointer select-none items-center gap-2.5">
						<input
							type="checkbox"
							checked={exento}
							onChange={(e) => setExento(e.target.checked)}
							className="h-4 w-4 rounded border-slate-300 accent-slate-600"
						/>
						<span className="text-sm font-semibold text-slate-700">Exento</span>
					</label>
					{exento && (
						<p className="mt-1.5 text-xs text-slate-500">
							El precio final será{" "}
							<span className="font-semibold text-emerald-600">$0.00</span>
						</p>
					)}
				</div>

				{/* ── Resumen de precio ── */}
				<div className="rounded-xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200/70 shadow-sm">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						Resumen
					</p>
					{inventarioChecked && productos.length > 0 && (
						<div className="flex justify-between py-1 text-sm text-slate-600">
							<span>
								Inventario ({productos.length} artículo
								{productos.length !== 1 ? "s" : ""})
							</span>
							<span>{formatCurrency(totalInventario)}</span>
						</div>
					)}
					{servicios.length > 0 && (
						<div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								Servicios
							</p>
							<ul className="space-y-2 text-sm text-slate-700">
								{servicios.map((servicio, index) => (
									<li key={`servicio-${index}`} className="flex items-center justify-between gap-2">
										<span className="font-medium text-slate-800">
											{servicio.tipo}
										</span>
										<span className="text-sm font-medium text-slate-700">
											{formatCurrency(servicio.precio)}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
					{listaNuevaConsulta.length > 0 && (
						<div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								Consultas
							</p>
							<ul className="space-y-2 text-sm text-slate-700">
								{listaNuevaConsulta.map((consulta, index) => {
									const amount = parseMoneyValue(consulta?.aportacion);
									return (
										<li key={index} className="flex items-center justify-between gap-2">
											<div>
												<span>
													{consulta.tipo_consulta || consulta.id_consulta_local || `Consulta ${index + 1}`}
												</span>
												{consulta.fecha_cita ? (
													<span className="ml-2 text-xs text-slate-500">
														{formatDate(String(consulta.fecha_cita).split(" ")[0])}
													</span>
												) : null}
											</div>
											<span className="text-sm font-medium text-slate-700">
												{formatCurrency(amount)}
											</span>
										</li>
									);
								})}
							</ul>
						</div>
					)}
					{listaNuevoEstudio.length > 0 && (
						<div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								Estudios
							</p>
							<ul className="space-y-2 text-sm text-slate-700">
								{listaNuevoEstudio.map((estudio, index) => {
									const amount = parseMoneyValue(estudio?.aportacion);
									return (
										<li key={index} className="flex items-center justify-between gap-2">
											<div>
												<span>
													{estudio.id_tipo_estudio ? `Estudio #${estudio.id_tipo_estudio}` : `Estudio ${index + 1}`}
												</span>
												{estudio.fecha_cita ? (
													<span className="ml-2 text-xs text-slate-500">
														{formatDate(String(estudio.fecha_cita).split(" ")[0])}
													</span>
												) : null}
											</div>
											<span className="text-sm font-medium text-slate-700">
												{formatCurrency(amount)}
											</span>
										</li>
									);
								})}
							</ul>
						</div>
					)}
					{draftMovements.length > 0 && (
						<div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								Movimientos
							</p>
							<ul className="space-y-2 text-sm text-slate-700">
								{draftMovements.map((draft) => (
									<li key={draft.id} className="flex items-start justify-between gap-3">
										<div>
											<p className="font-medium text-slate-800">
												{draft.input.itemName || "Articulo"}
											</p>
											<p className="text-xs text-slate-500">
												{draft.input.movementType === "in" ? "Entrada" : "Salida"} · {draft.input.quantity} uds · {formatCurrency(draft.unitPrice)} c/u
											</p>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-slate-700">
												{formatCurrency(draft.unitPrice * draft.input.quantity)}
											</span>
										</div>
									</li>
								))}
							</ul>
							{movementSubmitError ? (
								<p className="mt-2 text-xs text-rose-700" role="alert">
									{movementSubmitError}
								</p>
							) : null}
						</div>
					)}
					{/* Discount row */}
					{!exento && (
						<div className="flex items-center justify-between py-1 text-sm text-slate-500">
							<span className="flex items-center gap-1.5">
								Descuento
								<span className="flex items-center gap-0.5">
									<input
										type="number"
										min="0"
										max="100"
										step="1"
										value={descuentoPct === 0 ? "" : String(descuentoPct)}
										placeholder="0"
										onChange={(e) => {
											const v = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
											setDescuentoPct(v);
										}}
										className="h-6 w-12 rounded border border-slate-200 bg-white px-1.5 text-center text-xs text-slate-600 focus:border-slate-400 focus:outline-none"
									/>
									<span className="text-xs">%</span>
								</span>
							</span>
							<span className={descuentoPct > 0 ? "text-amber-600" : "text-slate-300"}>
								{descuentoPct > 0 ? `-${formatCurrency(descuentoMonto)}` : "—"}
							</span>
						</div>
					)}
					<div className="mt-2 flex justify-between border-t border-slate-200 pt-3 items-end">
						<span className="text-sm font-semibold text-slate-700">Total</span>
						<span className={cn("text-xl font-bold", exento ? "text-emerald-600" : "text-slate-900")}>
							{formatCurrency(totalFinal)}
						</span>
					</div>
				</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
					<Button variant="ghost" onClick={handleClose}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={handleCrear}
						disabled={!canCrear || creating}
						leftIcon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
					>
						Crear
					</Button>
				</div>
			</Modal>

			<NuevoServicioModal
				open={servicioModalOpen}
				onClose={() => setServicioModalOpen(false)}
				onSelectConsulta={() => setNuevaConsultaModalAbierto(true)}
				onSelectEstudio={() => setNuevoEstudioModalAbierto(true)}
			/>

			<NewMovementModal
				open={open && movementModalOpen}
				onClose={() => setMovementModalOpen(false)}
				itemTypes={movementItemTypes}
				submitMode="draft"
				fixedMovementType="out"
				onDraft={handleMovementDraft}
			/>
		<NuevaConsultaModal
			open={nuevaConsultaModalAbierto}
			onClose={() => setNuevaConsultaModalAbierto(false)}
			listaNuevaConsulta={listaNuevaConsulta}
			setListaNuevaConsulta={setListaNuevaConsulta}
			setModalAbiertoNuevaConsulta={setNuevaConsultaModalAbierto}
			id_recibo={0}
			defaultAsociadoId={getAsociadoNumericId(asociadoSeleccionado)}
			defaultAsociadoNombre={asociadoSeleccionado?.nombre}
		/>
		<NuevoEstudioModal
			open={nuevoEstudioModalAbierto}
			onClose={() => setNuevoEstudioModalAbierto(false)}
			defaultFolioConsulta={defaultFolioConsultaEstudio}
			defaultAsociadoId={getAsociadoNumericId(asociadoSeleccionado)}
			defaultAsociadoNombre={asociadoSeleccionado?.nombre}
			setListaNuevoEstudio={setListaNuevoEstudio}
			listaNuevaConsulta={listaNuevaConsulta}
			setModalAbiertoNuevoEstudio={setNuevoEstudioModalAbierto}
		/>
	</>
	);
}

export default function RecibosPage() {
	const router = useRouter();
	const [sessionLoaded, setSessionLoaded] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const RECIBOS_PAGE_SIZE = 5;

	const [recibos, setRecibos] = useState<Recibo[]>([]);
	const [recibosNextCursor, setRecibosNextCursor] = useState<string | null>(null);
	const [recibosLoading, setRecibosLoading] = useState(true);
	const [recibosLoadingMore, setRecibosLoadingMore] = useState(false);
	const [recibosError, setRecibosError] = useState<string | null>(null);
	const [pagos, setPagos] = useState<Pago[]>(PAGOS_INICIALES);

	const [nuevoOpen, setNuevoOpen] = useState(false);
	const [reciboActivo, setReciboActivo] = useState<Recibo | null>(null);
	const [desgloseRecibo, setDesgloseRecibo] = useState<Recibo | null>(null);
	const [reciboDetalle, setReciboDetalle] = useState<Recibo | null>(null);

	const [filterId, setFilterId] = useState("");
	const [filterNombre, setFilterNombre] = useState("");
	const [filterFecha, setFilterFecha] = useState("");
	const [filterEstatus, setFilterEstatus] = useState("todos");

	const debouncedId = useDebouncedValue(filterId, 300);
	const debouncedNombre = useDebouncedValue(filterNombre, 300);
	const recibosQueryKey = useMemo(
		() => `${debouncedId}__${debouncedNombre}__${filterFecha}__${filterEstatus}`,
		[debouncedId, debouncedNombre, filterFecha, filterEstatus],
	);

	useEffect(() => {
		getSession().then((session) => {
			setSessionLoaded(session);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		let alive = true;
		setRecibosLoading(true);
		setRecibosError(null);
		fetchRecibos({
			cursor: null,
			limit: RECIBOS_PAGE_SIZE,
			filters: {
				id: debouncedId,
				nombre: debouncedNombre,
				fecha: filterFecha,
				estatus: filterEstatus,
			},
		})
			.then((data) => {
				if (!alive) return;
				setRecibos(data.items);
				setRecibosNextCursor(data.nextCursor);
			})
			.catch(() => {
				if (alive) setRecibosError("Error al cargar recibos.");
			})
			.finally(() => {
				if (!alive) return;
				setRecibosLoading(false);
			});
		return () => { alive = false; };
	}, [recibosQueryKey, debouncedId, debouncedNombre, filterFecha, filterEstatus]);

	const consumedRef = useRef(false);

	useEffect(() => {

		const params = new URLSearchParams(window.location.search);

		const redirectRecibo = params.get("recibo");

		if (consumedRef.current) return;
		if (!redirectRecibo) return;
		if (!recibos.length) return;

		const selectedRecibo = recibos.find(
			(r) => r.id === Number(redirectRecibo)
		);

		if (selectedRecibo) {
			consumedRef.current = true;

			setReciboDetalle(selectedRecibo);

			setTimeout(() => {
				router.replace("/recibos");
			}, 1);
		}
	}, [recibos]);


	useEffect(() => {
		async function getPagos(){
			const res = await fetch("/api/recibos/lista_pagos");

			if (res.ok){
				const data = await res.json();

				if (data.message === "Success"){

					setPagos(data.data);

				}
			}
		}
		getPagos();
	}, [])

	async function onLoadMoreRecibos() {
		if (!recibosNextCursor) return;
		setRecibosLoadingMore(true);
		try {
			const data = await fetchRecibos({
				cursor: recibosNextCursor,
				limit: RECIBOS_PAGE_SIZE,
				filters: {
					id: debouncedId,
					nombre: debouncedNombre,
					fecha: filterFecha,
					estatus: filterEstatus,
				},
			});
			setRecibos((prev) => [...prev, ...data.items]);
			setRecibosNextCursor(data.nextCursor);
		} catch {
			setRecibosError("No se pudo cargar más datos.");
		} finally {
			setRecibosLoadingMore(false);
		}
	}

	async function handleRegistrarPago(monto: number, metodoPago: MetodoPago) {
		if (!reciboActivo) return;

		const nuevoPago: Pago = {
			id: `PAG-${Date.now()}`,
			idRecibo: String(reciboActivo.id),
			monto: monto,
			metodoPago: metodoPago,
			fechaPago: new Date().toISOString().split("T")[0],
		};
		let paymentPayload: { message?: string } | null = null;
		try {
			const paymentHandler = await fetch("/api/recibos/pagar",{
				method: "POST",
				headers:{
					"Content-Type": "application/json"
				},
				body: JSON.stringify(nuevoPago)
			});

			try {
				paymentPayload = await paymentHandler.json();
			} catch {
				paymentPayload = null;
			}

			if (!paymentHandler.ok || paymentPayload?.message !== "Success") {
				const message = paymentPayload?.message && paymentPayload.message !== "Failed"
					? paymentPayload.message
					: "No se pudo registrar el pago.";
				alert(message);
				return;
			}
		} catch {
			alert("No se pudo registrar el pago.");
			return;
		}

		setPagos((prev) => [...prev, nuevoPago]);

		setRecibos((prev) =>
			prev.map((r) => {
				if (r.id !== reciboActivo.id) return r;
				return {
					...r,
					montoPagado: Math.round((r.montoPagado + monto) * 100) / 100,
				};
			}),
		);

		setReciboActivo((prev) => {
			if (!prev) return null;
			return {
				...prev,
				montoPagado: Math.round((prev.montoPagado + monto) * 100) / 100,
			};
		});
	}

	const recibosFiltrados = useMemo(() => recibos, [recibos]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-24">
				<p className="text-slate-500">Cargando...</p>
			</div>
		);
	}

	if (!sessionLoaded) {
		return (
			<div className="flex items-center justify-center py-24">
				<p className="text-slate-500">No autorizado</p>
			</div>
		);
	}

	return (
		<>
			<NuevoReciboModal
				open={nuevoOpen}
				onClose={() => setNuevoOpen(false)}
				onCrear={(r) => setRecibos((prev) => [r, ...prev])}
			/>
			<RegistrarPagoModal
				recibo={reciboActivo}
				pagos={pagos}
				onRegistrar={handleRegistrarPago}
				onClose={() => setReciboActivo(null)}
			/>
			<ReciboDetailModal
				recibo={reciboDetalle}
				pagos={pagos}
				onClose={() => setReciboDetalle(null)}
			/>
			<DesgloseModal
				recibo={desgloseRecibo}
				onClose={() => setDesgloseRecibo(null)}
			/>

			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-4xl font-semibold tracking-tight text-slate-800">
							Recibos
						</h1>
					</div>
					<Button
						variant="secondary"
						leftIcon={<Plus className="h-4 w-4" />}
						onClick={() => setNuevoOpen(true)}
					>
						Nuevo recibo
					</Button>
				</div>

				{/* Filters */}
				<div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200/70">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								className="pl-9"
								placeholder="Buscar por ID"
								value={filterId}
								onChange={(e) => setFilterId(e.target.value)}
							/>
						</div>
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								className="pl-9"
								placeholder="Buscar por nombre"
								value={filterNombre}
								onChange={(e) => setFilterNombre(e.target.value)}
							/>
						</div>
						<Input
							type="date"
							value={filterFecha}
							onChange={(e) => setFilterFecha(e.target.value)}
						/>
						<Select
							value={filterEstatus}
							onChange={(e) => setFilterEstatus(e.target.value)}
						>
							<option value="todos">Todos los estatus</option>
							<option value="Pagado">Pagado</option>
							<option value="Pagado parcialmente">Pagado parcialmente</option>
							<option value="Pendiente">Pendiente</option>
						</Select>
					</div>
				</div>

				{/* Table */}
				<div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
					<div className="w-full overflow-x-auto">
						<table className="min-w-[600px] w-full border-collapse">
							<thead>
								<tr className="bg-slate-600 text-white">
									<th className="rounded-tl-2xl px-5 py-4 text-left text-sm font-semibold">
										ID Recibo
									</th>
									<th className="px-5 py-4 text-left text-sm font-semibold">
										Asociado
									</th>
									<th className="px-5 py-4 text-left text-sm font-semibold">
										Fecha de emisión
									</th>
									<th className="px-5 py-4 text-right text-sm font-semibold">
										Pagado / Total
									</th>
									<th className="rounded-tr-2xl px-5 py-4 text-center text-sm font-semibold">
										Desglose
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{recibosLoading ? (
									<tr>
										<td
											colSpan={5}
											className="px-5 py-10 text-center text-sm text-slate-400"
										>
											Cargando...
										</td>
									</tr>
								) : recibosError ? (
									<tr>
										<td
											colSpan={5}
											className="px-5 py-10 text-center text-sm text-red-500"
										>
											{recibosError}
										</td>
									</tr>
								) : recibosFiltrados.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-5 py-10 text-center text-sm text-slate-400"
										>
											No se encontraron recibos.
										</td>
									</tr>
								) : (
									recibosFiltrados.map((r) => {
										const estatus = derivarEstatus(r);
										const totalEsCero = r.montoTotal === 0;
										return (
											<tr
												key={r.id}
												className="cursor-pointer transition hover:bg-slate-50"
												onClick={() => setReciboDetalle(r)}
											>
												<td className="px-5 py-4 text-sm font-medium text-slate-800">
													REC-{r.id}
												</td>
												<td className="px-5 py-4 text-sm text-slate-800">
													{r.asociado}
												</td>
												<td className="px-5 py-4 text-sm text-slate-600">
													{formatDate(r.fechaEmision)}
												</td>
												<td className="px-5 py-4 text-right text-sm">
													<span
														className={cn("font-medium", ESTATUS_AMOUNT_CLASS[estatus])}
													>
														{formatCurrency(r.montoPagado)}
													</span>
													<span
														className={cn(
															totalEsCero ? "font-semibold text-red-600" : "text-slate-400",
														)}
													>
														{" "}
														/ {formatCurrency(r.montoTotal)}
													</span>
												</td>
												<td
													className="px-5 py-4 text-center"
													onClick={(e) => e.stopPropagation()}
												>
													<Button
														variant="ghost"
														size="sm"
														className="h-9 w-9 px-0"
														onClick={() => setReciboActivo(r)}
														aria-label="Registrar pago"
													>
														<Banknote className="h-4 w-4" />
													</Button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
					<div className="flex justify-center p-5">
						<Button
							variant="secondary"
							onClick={onLoadMoreRecibos}
							disabled={!recibosNextCursor || recibosLoading || recibosLoadingMore}
						>
							{recibosLoadingMore ? "Cargando..." : "Cargar más datos"}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
