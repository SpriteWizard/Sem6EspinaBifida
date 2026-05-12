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
	productos: ReciboProducto[];
}

interface Pago {
	id: string;
	idRecibo: string;
	monto: number;
	metodoPago: MetodoPago;
	fechaPago: string;
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

const RECIBOS_INICIALES: Recibo[] = [
	{
		id: "REC-2026-0001",
		asociado: "María Guadalupe Hernández Torres",
		fechaEmision: "2026-03-13",
		montoTotal: 3540.0,
		montoPagado: 3540.0,
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
		productos: [],
	},
	{
		id: "REC-2026-0006",
		asociado: "Diego Morales Ríos",
		fechaEmision: "2026-03-28",
		montoTotal: 1650.0,
		montoPagado: 800.0,
		productos: [],
	},
	{
		id: "REC-2026-0007",
		asociado: "Valentina Cruz Mendoza",
		fechaEmision: "2026-04-01",
		montoTotal: 850.0,
		montoPagado: 850.0,
		productos: [],
	},
	{
		id: "REC-2026-0008",
		asociado: "Andrés Torres Guzmán",
		fechaEmision: "2026-04-05",
		montoTotal: 2400.0,
		montoPagado: 0,
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
	const subtotal = productos.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);

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
									<tr className="border-t-2 border-slate-300">
										<td
											colSpan={3}
											className="px-5 py-3 text-right text-sm font-semibold text-slate-700"
										>
											Total
										</td>
										<td className="px-5 py-3 text-right text-sm font-bold text-slate-900">
											{formatCurrency(subtotal)}
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
	const [fecha, setFecha] = useState("");
	const [montoManual, setMontoManual] = useState("");
	const [productos, setProductos] = useState<ReciboProducto[]>([]);

	const [productSearch, setProductSearch] = useState("");
	const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [creating, setCreating] = useState(false);

	const searchRef = useRef<HTMLDivElement>(null);

	const computedTotal = productos.reduce(
		(s, p) => s + p.cantidad * p.precioUnitario,
		0,
	);
	const hasProductos = productos.length > 0;
	const montoFinal = hasProductos ? computedTotal : parseFloat(montoManual) || 0;

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

	// Close dropdown on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	function handleClose() {
		setAsociado("");
		setFecha("");
		setMontoManual("");
		setProductos([]);
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
		const value = field === "cantidad" ? parseInt(raw, 10) : parseFloat(raw);
		if (isNaN(value) || value < 0) return;
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
			montoTotal: montoFinal,
			montoPagado: 0,
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
					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">
							Asociado
						</label>
						<Input
							placeholder="Nombre del asociado"
							value={asociado}
							onChange={(e) => setAsociado(e.target.value)}
						/>
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
												value={String(p.cantidad)}
												onChange={(e) => updateProducto(i, "cantidad", e.target.value)}
												className="w-20 text-right"
											/>
										</td>
										<td className="px-4 py-2 text-right">
											<Input
												type="number"
												min="0"
												step="0.01"
												value={String(p.precioUnitario)}
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

				{/* Monto total */}
				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Monto total
						{hasProductos && (
							<span className="ml-1.5 font-normal text-slate-400">
								(calculado de los productos)
							</span>
						)}
					</label>
					<Input
						type="number"
						min="0.01"
						step="0.01"
						placeholder="0.00"
						value={montoManual}
						onChange={(e) => setMontoManual(e.target.value)}
					/>
				</div>
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

	const [recibos, setRecibos] = useState<Recibo[]>(RECIBOS_INICIALES);
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
						<p className="mt-1 text-sm text-slate-500">
							{recibosFiltrados.length} recibo
							{recibosFiltrados.length !== 1 ? "s" : ""}
						</p>
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
								{recibosFiltrados.length === 0 ? (
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
													<span className="text-slate-400">
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
