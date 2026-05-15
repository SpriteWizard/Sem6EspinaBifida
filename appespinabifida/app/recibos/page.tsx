"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";
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
} from "lucide-react";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { cn } from "../lib/utils/cn";
import { searchInventoryItemsByName } from "../lib/api/inventory";
import type { InventoryItem } from "../lib/types/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

type Estatus = "Pagado" | "Pagado parcialmente" | "Pendiente";
type MetodoPago = "efectivo" | "tarjeta" | "deposito" | "transferencia";
type TipoPaciente = "A" | "B";

interface ReciboProducto {
	itemId: number | null;
	itemName: string;
	cantidad: number;
	precioUnitario: number;
}

interface Recibo {
	id: string;
	asociado: string;
	fechaEmision: string;
	montoTotal: number;
	montoPagado: number;
	tipoPaciente: TipoPaciente;
	descuentoPct: number;
	productos: ReciboProducto[];
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

function formatDate(iso: string) {
	return new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// ─── Discount ─────────────────────────────────────────────────────────────────

const DESCUENTO_DEFAULT: Record<TipoPaciente, number> = { A: 0, B: 50 };

function aplicarDescuento(bruto: number, pct: number): number {
	return Math.round(bruto * (1 - pct / 100) * 100) / 100;
}

// ─── Data layer ───────────────────────────────────────────────────────────────

async function fetchRecibos(): Promise<Recibo[]> {
	// TODO: replace with real API call once endpoint is live
	// const res = await fetch("/api/recibos/obtener");
	// if (!res.ok) throw new Error("Error al cargar recibos");
	// return res.json();
	return RECIBOS_INICIALES;
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

const RECIBOS_INICIALES: Recibo[] = [
	{
		id: "REC-2026-0001",
		asociado: "María Guadalupe Hernández Torres",
		fechaEmision: "2026-03-13",
		montoTotal: 3540.0,
		montoPagado: 3540.0,
		tipoPaciente: "A",
		descuentoPct: 0,
		productos: [
			{ itemId: null, itemName: "Silla de ruedas manual", cantidad: 1, precioUnitario: 2500.0 },
			{ itemId: null, itemName: "Cojín antiescaras", cantidad: 2, precioUnitario: 520.0 },
		],
	},
	{
		id: "REC-2026-0002",
		asociado: "Carlos Eduardo Ramírez López",
		fechaEmision: "2026-03-15",
		montoTotal: 1800.0,
		montoPagado: 0,
		tipoPaciente: "B",
		descuentoPct: 50,
		productos: [
			{ itemId: null, itemName: "Andadera estándar", cantidad: 1, precioUnitario: 1200.0 },
			{ itemId: null, itemName: "Plantillas ortopédicas", cantidad: 2, precioUnitario: 300.0 },
		],
	},
	{
		id: "REC-2026-0003",
		asociado: "Ana Sofía Martínez Pérez",
		fechaEmision: "2026-03-20",
		montoTotal: 2250.0,
		montoPagado: 1000.0,
		tipoPaciente: "A",
		descuentoPct: 0,
		productos: [
			{ itemId: null, itemName: "Silla de ruedas pediátrica", cantidad: 1, precioUnitario: 2250.0 },
		],
	},
	{
		id: "REC-2026-0004",
		asociado: "Roberto Jiménez Vega",
		fechaEmision: "2026-03-22",
		montoTotal: 950.0,
		montoPagado: 950.0,
		tipoPaciente: "B",
		descuentoPct: 50,
		productos: [
			{ itemId: null, itemName: "Colchón antiescaras", cantidad: 1, precioUnitario: 950.0 },
		],
	},
	{
		id: "REC-2026-0005",
		asociado: "Lucía Fernández Castro",
		fechaEmision: "2026-03-25",
		montoTotal: 3100.0,
		montoPagado: 0,
		tipoPaciente: "A",
		descuentoPct: 0,
		productos: [],
	},
	{
		id: "REC-2026-0006",
		asociado: "Diego Morales Ríos",
		fechaEmision: "2026-03-28",
		montoTotal: 1650.0,
		montoPagado: 800.0,
		tipoPaciente: "B",
		descuentoPct: 50,
		productos: [],
	},
	{
		id: "REC-2026-0007",
		asociado: "Valentina Cruz Mendoza",
		fechaEmision: "2026-04-01",
		montoTotal: 850.0,
		montoPagado: 850.0,
		tipoPaciente: "A",
		descuentoPct: 0,
		productos: [],
	},
	{
		id: "REC-2026-0008",
		asociado: "Andrés Torres Guzmán",
		fechaEmision: "2026-04-05",
		montoTotal: 2400.0,
		montoPagado: 0,
		tipoPaciente: "B",
		descuentoPct: 50,
		productos: [],
	},
];

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
		.filter((p) => p.idRecibo === recibo?.id)
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
			title={recibo ? `Desglose — ${recibo.id}` : "Desglose"}
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
	const [asociado, setAsociado] = useState("");
	const [asociadoSearch, setAsociadoSearch] = useState("");
	const [showAsociadoDropdown, setShowAsociadoDropdown] = useState(false);
	const [asociados, setAsociados] = useState<AsociadoMini[]>([]);
	const [asociadosLoading, setAsociadosLoading] = useState(false);

	const [fecha, setFecha] = useState("");
	const [montoManual, setMontoManual] = useState("");
	const [productos, setProductos] = useState<ReciboProducto[]>([]);
	const [tipoPaciente, setTipoPaciente] = useState<TipoPaciente>("A");
	const [descuentoPct, setDescuentoPct] = useState(0);

	const [productSearch, setProductSearch] = useState("");
	const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [creating, setCreating] = useState(false);

	const searchRef = useRef<HTMLDivElement>(null);
	const asociadoRef = useRef<HTMLDivElement>(null);

	const computedTotal = productos.reduce(
		(s, p) => s + p.cantidad * p.precioUnitario,
		0,
	);
	const hasProductos = productos.length > 0;
	const montoBruto = hasProductos ? computedTotal : parseFloat(montoManual) || 0;
	const montoConDescuento = aplicarDescuento(montoBruto, descuentoPct);

	// Load associates when modal opens
	useEffect(() => {
		if (!open) return;
		let alive = true;
		setAsociadosLoading(true);
		fetchAsociados()
			.then((data) => { if (alive) { setAsociados(data); setAsociadosLoading(false); } })
			.catch(() => { if (alive) setAsociadosLoading(false); });
		return () => { alive = false; };
	}, [open]);

	// Reset descuentoPct to default when patient type changes
	useEffect(() => {
		setDescuentoPct(DESCUENTO_DEFAULT[tipoPaciente]);
	}, [tipoPaciente]);

	// Auto-populate montoManual when products change
	useEffect(() => {
		if (hasProductos) {
			setMontoManual(computedTotal.toFixed(2));
		}
	}, [computedTotal, hasProductos]);

	// Debounced inventory search
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

	// Close inventory dropdown on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// Close associate dropdown on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (asociadoRef.current && !asociadoRef.current.contains(e.target as Node)) {
				setShowAsociadoDropdown(false);
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// Filter associates client-side
	const filteredAsociados = useMemo(() => {
		const q = asociadoSearch.trim().toLowerCase();
		if (!q) return asociados.slice(0, 8);
		return asociados.filter((a) => a.nombre.toLowerCase().includes(q)).slice(0, 8);
	}, [asociados, asociadoSearch]);

	function handleClose() {
		setAsociado("");
		setAsociadoSearch("");
		setShowAsociadoDropdown(false);
		setFecha("");
		setMontoManual("");
		setProductos([]);
		setTipoPaciente("A");
		setProductSearch("");
		setSearchResults([]);
		setShowDropdown(false);
		setCreating(false);
		onClose();
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

	function updateProducto(
		index: number,
		field: "cantidad" | "precioUnitario",
		raw: string,
	) {
		const parsed = field === "cantidad" ? parseInt(raw, 10) : parseFloat(raw);
		const value = isNaN(parsed) || parsed < 0 ? 0 : parsed;
		setProductos((prev) =>
			prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
		);
	}

	async function handleGuardar() {
		if (!asociado.trim() || !fecha) return;
		if (!hasProductos && (isNaN(parseFloat(montoManual)) || parseFloat(montoManual) <= 0)) return;

		setCreating(true);
		const id = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

		onCrear({
			id,
			asociado: asociado.trim(),
			fechaEmision: fecha,
			montoTotal: montoConDescuento,
			montoPagado: 0,
			tipoPaciente,
			descuentoPct,
			productos,
		});

		// Fire inventory exit movements for linked products (fire and forget)
		for (const prod of productos) {
			if (prod.itemId !== null && prod.cantidad > 0) {
				fetch("/api/inventario/movimientos/agregar", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						itemId: prod.itemId,
						movementType: "out",
						date: fecha,
						quantity: prod.cantidad,
						notes: `Salida por recibo ${id}`,
					}),
				}).catch(console.error);
			}
		}

		handleClose();
	}

	const canGuardar =
		asociado.trim().length > 0 &&
		fecha.length > 0 &&
		(hasProductos || (parseFloat(montoManual) > 0));

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title="Nuevo recibo"
			titleId="nuevo-recibo-title"
			className="max-w-2xl"
		>
			<div className="space-y-4 px-5 py-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{/* Associate dropdown */}
					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							Asociado
						</label>
						<div ref={asociadoRef} className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							{asociadosLoading && (
								<Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
							)}
							<Input
								className="pl-9 pr-9"
								placeholder="Buscar asociado…"
								value={asociadoSearch}
								onChange={(e) => {
									setAsociadoSearch(e.target.value);
									setAsociado("");
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
													setAsociado(a.nombre);
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
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							Fecha de emisión
						</label>
						<Input
							type="date"
							value={fecha}
							onChange={(e) => setFecha(e.target.value)}
						/>
					</div>
				</div>

				{/* Patient type */}
				<div>
					<p className="mb-2 text-xs font-medium text-slate-600">Tipo de paciente</p>
					<div className="flex gap-2">
						{(["A", "B"] as TipoPaciente[]).map((tipo) => (
							<button
								key={tipo}
								type="button"
								onClick={() => setTipoPaciente(tipo)}
								className={cn(
									"flex-1 rounded-lg border-2 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70",
									tipoPaciente === tipo
										? "border-slate-600 bg-slate-100 text-slate-800"
										: "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100",
								)}
							>
								Tipo {tipo}
								{tipo === "B" && (
									<span className="ml-1.5 text-xs font-normal text-amber-600">
										(desc. aplicable)
									</span>
								)}
							</button>
						))}
					</div>
				</div>

				{/* Product search */}
				<div>
					<p className="mb-2 text-xs font-medium text-slate-600">
						Productos del inventario
					</p>
					<div ref={searchRef} className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						{searchLoading && (
							<Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
						)}
						<Input
							className="pl-9 pr-9"
							placeholder="Buscar artículo en inventario…"
							value={productSearch}
							onChange={(e) => setProductSearch(e.target.value)}
							onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
						/>
						{showDropdown && searchResults.length > 0 && (
							<ul className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
								{searchResults.map((item) => (
									<li key={item.id}>
										<button
											type="button"
											className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
											onClick={() => addProduct(item)}
										>
											<span className="font-medium text-slate-800">{item.name}</span>
											<span className="ml-3 shrink-0 text-xs text-slate-400">
												{item.cuotaRecuperacion != null
													? formatCurrency(item.cuotaRecuperacion)
													: "Sin precio"}
											</span>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{/* Product list */}
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
												onChange={(e) =>
													updateProducto(i, "precioUnitario", e.target.value)
												}
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
							<tfoot>
								<tr className="border-t-2 border-slate-200 bg-slate-50">
									<td
										colSpan={3}
										className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"
									>
										Total calculado
									</td>
									<td className="px-4 py-2.5 text-right font-bold text-slate-900">
										{formatCurrency(computedTotal)}
									</td>
									<td />
								</tr>
							</tfoot>
						</table>
					</div>
				)}

				{/* Monto base */}
				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						{descuentoPct > 0 ? "Monto base (antes del descuento)" : "Monto total"}
						{hasProductos && (
							<span className="ml-1.5 font-normal text-slate-400">
								(calculado de los productos)
							</span>
						)}
					</label>
					<Input
						type="number"
						min="0"
						step="10"
						placeholder="0"
						value={montoManual}
						onChange={(e) => setMontoManual(e.target.value)}
					/>
				</div>

				{/* Discount breakdown — shown for Tipo B when there's an amount */}
				{tipoPaciente === "B" && montoBruto > 0 && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
						<div className="flex justify-between text-slate-600">
							<span>Subtotal</span>
							<span>{formatCurrency(montoBruto)}</span>
						</div>
						<div className="flex items-center justify-between text-amber-700">
							<span className="flex items-center gap-1">
								Descuento Tipo B
								<span className="ml-1 flex items-center gap-0.5">
									(
									<Input
										type="number"
										min="0"
										max="100"
										step="10"
										value={String(descuentoPct)}
										onChange={(e) => {
											const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
											setDescuentoPct(v);
										}}
										className="h-6 w-14 px-1.5 text-center text-xs"
									/>
									%)
								</span>
							</span>
							<span>-{formatCurrency(montoBruto * descuentoPct / 100)}</span>
						</div>
						<div className="mt-1 flex justify-between font-semibold text-slate-800">
							<span>Total a cobrar</span>
							<span>{formatCurrency(montoConDescuento)}</span>
						</div>
					</div>
				)}
			</div>

			<div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
				<Button variant="ghost" onClick={handleClose}>
					Cancelar
				</Button>
				<Button
					variant="primary"
					onClick={handleGuardar}
					disabled={!canGuardar || creating}
					leftIcon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
				>
					Guardar
				</Button>
			</div>
		</Modal>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecibosPage() {
	const [sessionLoaded, setSessionLoaded] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	const [recibos, setRecibos] = useState<Recibo[]>([]);
	const [recibosError, setRecibosError] = useState<string | null>(null);
	const [pagos, setPagos] = useState<Pago[]>(PAGOS_INICIALES);

	const [nuevoOpen, setNuevoOpen] = useState(false);
	const [reciboActivo, setReciboActivo] = useState<Recibo | null>(null);
	const [desgloseRecibo, setDesgloseRecibo] = useState<Recibo | null>(null);

	const [filterId, setFilterId] = useState("");
	const [filterNombre, setFilterNombre] = useState("");
	const [filterFecha, setFilterFecha] = useState("");
	const [filterEstatus, setFilterEstatus] = useState("todos");

	const debouncedId = useDebouncedValue(filterId, 300);
	const debouncedNombre = useDebouncedValue(filterNombre, 300);

	useEffect(() => {
		getSession().then((session) => {
			setSessionLoaded(session);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		let alive = true;
		fetchRecibos()
			.then((data) => { if (alive) setRecibos(data); })
			.catch(() => { if (alive) setRecibosError("Error al cargar recibos."); });
		return () => { alive = false; };
	}, []);

	function handleRegistrarPago(monto: number, metodoPago: MetodoPago) {
		if (!reciboActivo) return;

		const nuevoPago: Pago = {
			id: `PAG-${Date.now()}`,
			idRecibo: reciboActivo.id,
			monto,
			metodoPago,
			fechaPago: new Date().toISOString().split("T")[0],
		};

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

	const recibosFiltrados = useMemo(
		() =>
			recibos.filter((r) => {
				if (debouncedId && !r.id.toLowerCase().includes(debouncedId.toLowerCase()))
					return false;
				if (
					debouncedNombre &&
					!r.asociado.toLowerCase().includes(debouncedNombre.toLowerCase())
				)
					return false;
				if (filterFecha && r.fechaEmision !== filterFecha) return false;
				if (filterEstatus !== "todos" && derivarEstatus(r) !== filterEstatus)
					return false;
				return true;
			}),
		[recibos, debouncedId, debouncedNombre, filterFecha, filterEstatus],
	);

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
								{recibosError ? (
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
												onClick={() => setReciboActivo(r)}
											>
												<td className="px-5 py-4 text-sm font-medium text-slate-800">
													{r.id}
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
														leftIcon={<Receipt className="h-4 w-4" />}
														onClick={() => setDesgloseRecibo(r)}
													>
														Ver
													</Button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</>
	);
}
