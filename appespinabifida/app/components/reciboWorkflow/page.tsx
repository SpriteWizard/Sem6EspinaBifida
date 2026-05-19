"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '../ui/Modal'
import { NuevaConsultaModal } from './nuevaConsultaModal'
import { NuevoEstudioModal } from './nuevoEstudioModal'
import { Button } from '../ui/Button'

type nuevoRecibo = {
  "id_asociado": number,
  "id_usuario": number,
  "fecha_limite": string,
  "tipo_zona": string,
  "tipo_cuota": string,
  "total": number,
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
  total_pagado: 0,
  estatus: "",
  nota: ""
};

export default function ReciboWorkflowPage(){
    const  [listaNuevaConsulta, setListaNuevaConsulta] = useState<any[]>([]);
    const [listaNuevoEstudio, setListaNuevoEstudio] = useState<any[]>([]);
    const [nuevaConsultaModalAbierto, setNuevaConsultaModalAbierto] = useState(false);
    const [nuevoEstudioModalAbierto, setNuevoEstudioModalAbierto] = useState(false);
    const [idRecibo, setIDRecibo] = useState(51);
    const [nuevoRecibo, setNuevoRecibo] = useState(nuevoReciboDefault);



    async function sendData(){

        const resRecibo = await fetch('/api/recibos/nuevo',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoRecibo)
        })

        const id_recibo = (await resRecibo.json()).id_recibo
        
        listaNuevaConsulta.forEach((e) => {
            e.id_recibo = id_recibo
        })

        const resServicios = await fetch('/api/recibos/agregarServicios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'            
            },
            body: JSON.stringify({
                consultas: listaNuevaConsulta,
                estudios: listaNuevoEstudio
            })
        })

        if (resServicios.ok){
            if ((await resServicios.json()).message === "Success"){
                alert("Servicios agregados exitosamente");
                setListaNuevaConsulta([]);
                setListaNuevoEstudio([]);
            } else {
                alert("Error al agregar servicios");
            }
        }
    }

    return (
        <div>
            <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
                <h2>Nuevo Recibo - Datos de Prueba</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label>ID Asociado:</label>
                        <input
                            type="number"
                            value={nuevoRecibo.id_asociado}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, id_asociado: parseInt(e.target.value) || 0})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>ID Usuario:</label>
                        <input
                            type="number"
                            value={nuevoRecibo.id_usuario}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, id_usuario: parseInt(e.target.value) || 0})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>Fecha Límite:</label>
                        <input
                            type="date"
                            value={nuevoRecibo.fecha_limite}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, fecha_limite: e.target.value})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>Tipo Zona:</label>
                        <input
                            type="text"
                            value={nuevoRecibo.tipo_zona}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, tipo_zona: e.target.value})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>Tipo Cuota:</label>
                        <input
                            type="text"
                            value={nuevoRecibo.tipo_cuota}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, tipo_cuota: e.target.value})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>Total:</label>
                        <input
                            type="number"
                            value={nuevoRecibo.total}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, total: parseFloat(e.target.value) || 0})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>Total Pagado:</label>
                        <input
                            type="number"
                            value={nuevoRecibo.total_pagado}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, total_pagado: parseFloat(e.target.value) || 0})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div>
                        <label>Estatus:</label>
                        <input
                            type="text"
                            value={nuevoRecibo.estatus}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, estatus: e.target.value})}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label>Nota:</label>
                        <textarea
                            value={nuevoRecibo.nota}
                            onChange={(e) => setNuevoRecibo({...nuevoRecibo, nota: e.target.value})}
                            style={{ width: '100%', padding: '5px', minHeight: '80px' }}
                        />
                    </div>
                </div>
                <Button onClick={() => alert(JSON.stringify(nuevoRecibo, null, 2))} style={{ marginTop: '10px' }}>Ver Recibo Data</Button>
            </div>

            <Button onClick={() => setNuevaConsultaModalAbierto(true)}>Agregar consulta</Button>
            <Button onClick={() => setNuevoEstudioModalAbierto(true)}>Agregar estudio</Button>
            <Button onClick={() => {alert(JSON.stringify(listaNuevaConsulta)); alert(JSON.stringify(listaNuevoEstudio))}}>Ver listas</Button>
            <NuevaConsultaModal
                open={nuevaConsultaModalAbierto}
                onClose={() => setNuevaConsultaModalAbierto(false)}
                listaNuevaConsulta={listaNuevaConsulta}
                setListaNuevaConsulta={setListaNuevaConsulta}
                setModalAbiertoNuevaConsulta={setNuevaConsultaModalAbierto}
                id_recibo={idRecibo}
            />
            <NuevoEstudioModal
                open={nuevoEstudioModalAbierto}
                onClose={() => setNuevoEstudioModalAbierto(false)}
                setListaNuevoEstudio={setListaNuevoEstudio}
                listaNuevaConsulta={listaNuevaConsulta}
                setModalAbiertoNuevoEstudio={setNuevoEstudioModalAbierto}
            />
            <Button onClick= {sendData}>Enviar Servicios</Button>
        </div>
    )
}