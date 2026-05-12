"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";

export default function RecibosPage() {
	let session;
	const [sessionLoaded, setSessionLoaded] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const [recibos, setRecibos] = useState<Recibo[]>(RECIBOS_INICIALES);
	const [pagos, setPagos] = useState<Pago[]>(PAGOS_INICIALES);

	const [nuevoOpen, setNuevoOpen] = useState(false);
	const [reciboActivo, setReciboActivo] = useState<Recibo | null>(null);

	const [filterId, setFilterId] = useState("");
	const [filterNombre, setFilterNombre] = useState("");
	const [filterFecha, setFilterFecha] = useState("");
	const [filterEstatus, setFilterEstatus] = useState("todos");

	const debouncedId = useDebouncedValue(filterId, 300);
	const debouncedNombre = useDebouncedValue(filterNombre, 300);

	useEffect(() => {
		getSession().then((session) => {
			session = session;
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

		// Keep modal summary in sync without closing
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
				if (
					debouncedId &&
					!r.id.toLowerCase().includes(debouncedId.toLowerCase())
				)
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
			<div className="flex min-h-screen items-center justify-center bg-[#B9E5FB]">
				<p className="text-gray-600">Cargando...</p>
			</div>
		);
	}

	if (!sessionLoaded) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#B9E5FB]">
				<p className="text-gray-600">No autorizado</p>
			</div>
		);
	}

	// Sample receipt data
	const conceptos = [
		{
			id: 1,
			concepto: "Terapia Física - Rehabilitación",
			tipo: "Sesión",
			cantidad: 2,
			unitario: 450.0,
			total: 900.0,
		},
		{
			id: 2,
			concepto: "Consulta Neurología Pediátrica",
			tipo: "Servicio",
			cantidad: 1,
			unitario: 850.0,
			total: 850.0,
		},
		{
			id: 3,
			concepto: "Hidroterapia Especializada",
			tipo: "Sesión",
			cantidad: 3,
			unitario: 380.0,
			total: 1140.0,
		},
		{
			id: 4,
			concepto: "Estudios de Laboratorio",
			tipo: "Servicio",
			cantidad: 1,
			unitario: 650.0,
			total: 650.0,
		},
	];

	const totalRecibo = conceptos.reduce((sum, item) => sum + item.total, 0);

	const metodosPago = [
		{ id: "efectivo", nombre: "Efectivo", descripcion: "Pago en efectivo" },
		{
			id: "tarjeta",
			nombre: "Tarjeta",
			descripcion: "Tarjeta débito/crédito",
		},
		{
			id: "deposito",
			nombre: "Depósito",
			descripcion: "Depósito bancario",
		},
		{
			id: "transferencia",
			nombre: "Transferencia",
			descripcion: "Transferencia bancaria",
		},
	];

	return (
		<div className="min-h-screen bg-[#B9E5FB] p-6">
			{/* Main Content */}
			<div className="mx-auto max-w-4xl">
				{/* Receipt Card */}
				<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
					{/* Header */}
					<div className="mb-6 flex items-start justify-between border-b border-gray-200 pb-6">
						<div>
							<h2 className="text-3xl font-bold text-gray-900">Recibo #001</h2>
							<p className="mt-2 text-sm text-gray-600">
								ID de Recibo: REC-2026-0001
							</p>
						</div>
						<div className="flex flex-col items-end gap-2">
							<span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
								✓ PAGADO
							</span>
						</div>
					</div>

					{/* Two Columns Section */}
					<div className="mb-8 grid grid-cols-2 gap-8">
						{/* Datos Asociado */}
						<div>
							<h3 className="mb-4 text-sm font-bold uppercase text-gray-700">
								Datos Asociado:
							</h3>
							<div className="space-y-3">
								<div>
									<p className="text-xs text-gray-500 uppercase">ID</p>
									<p className="text-lg font-medium text-gray-900">
										EB-2024-0147
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-500 uppercase">Nombre</p>
									<p className="text-lg font-medium text-gray-900">
										María Guadalupe Hernández Torres
									</p>
								</div>
							</div>
						</div>

						{/* Datos de Recibo */}
						<div>
							<h3 className="mb-4 text-sm font-bold uppercase text-gray-700">
								Datos de Recibo:
							</h3>
							<div className="space-y-3">
								<div>
									<p className="text-xs text-gray-500 uppercase">
										Fecha creación:
									</p>
									<p className="text-lg font-medium text-gray-900">
										13 de marzo de 2026
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-500 uppercase">
										Fecha límite:
									</p>
									<p className="text-lg font-medium text-gray-900">
										28 de marzo de 2026
									</p>
								</div>
							</div>
						</div>
					</div>
					<Button
						variant="secondary"
						leftIcon={<Plus className="h-4 w-4" />}
						onClick={() => setNuevoOpen(true)}
					>
						Nuevo recibo
					</Button>
				</div>

					{/* Conceptos Table */}
					<div className="mb-8">
						<h3 className="mb-4 text-sm font-bold uppercase text-gray-700">
							Conceptos
						</h3>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
											#
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
											Concepto
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
											Tipo
										</th>
										<th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
											Cantidad
										</th>
										<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
											Unitario
										</th>
										<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
											Total
										</th>
									</tr>
								</thead>
								<tbody>
									{conceptos.map((item) => (
										<tr
											key={item.id}
											className="border-b border-gray-100"
										>
											<td className="px-4 py-3 text-sm text-gray-900">
												{item.id}
											</td>
											<td className="px-4 py-3 text-sm text-gray-900">
												{item.concepto}
											</td>
											<td className="px-4 py-3 text-sm text-gray-600">
												{item.tipo}
											</td>
											<td className="px-4 py-3 text-center text-sm text-gray-900">
												{item.cantidad}
											</td>
											<td className="px-4 py-3 text-right text-sm text-gray-900">
												${item.unitario.toFixed(2)}
											</td>
											<td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
												${item.total.toFixed(2)}
											</td>
										</tr>
									))}
									<tr className="bg-gray-50">
										<td
											
											className="px-4 py-4 text-right text-sm font-bold text-gray-900"
										>
											TOTAL:
										</td>
										<td className="px-4 py-4 text-right text-lg font-bold text-gray-900">
											${totalRecibo.toFixed(2)}
										</td>
									</tr>
								</tbody>
							</table>
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

					{/* Método de Pago */}
					<div className="mb-8">
						<h3 className="mb-4 text-sm font-bold uppercase text-gray-700">
							Método de Pago
						</h3>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
							{metodosPago.map((metodo) => (
								<button
									key={metodo.id}
									className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 transition hover:border-[#003C64] hover:bg-blue-50"
								>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-lg">
										💳
									</div>
									<span className="text-xs font-semibold text-gray-900">
										{metodo.nombre}
									</span>
									<span className="text-center text-xs text-gray-600">
										{metodo.descripcion}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 border-t border-gray-200 pt-6">
						<button className="flex-1 rounded-lg bg-[#003C64] px-6 py-3 font-medium text-white transition hover:bg-[#002847]">
							📄 Imprimir
						</button>
						<button className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-900 transition hover:bg-gray-50">
							💰 Registrar pago
						</button>
						<button className="flex-1 rounded-lg border border-red-300 px-6 py-3 font-medium text-red-600 transition hover:bg-red-50">
							✕ Cancelar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
