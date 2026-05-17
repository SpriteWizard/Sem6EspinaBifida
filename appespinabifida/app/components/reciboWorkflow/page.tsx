"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '../ui/Modal'
import { NuevaConsultaModal } from './nuevaConsultaModal'
import { NuevoEstudioModal } from './nuevoEstudioModal'
import { Button } from '../ui/Button'

export default function ReciboWorkflowPage(){
    const  [listaNuevaConsulta, setListaNuevaConsulta] = useState<any[]>([]);
    const [listaNuevoEstudio, setListaNuevoEstudio] = useState<any[]>([]);
    const [nuevaConsultaModalAbierto, setNuevaConsultaModalAbierto] = useState(false);
    const [nuevoEstudioModalAbierto, setNuevoEstudioModalAbierto] = useState(false);
    const [idRecibo, setIDRecibo] = useState(51);

    async function sendData(){

        const resRecibo = await fetch('/api/recibos/crear',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                aquiponerDatosRecibo: 'DatosRecibo'
            })
        })

        const id_recibo = (await resRecibo.json()).id_recibo

        setIDRecibo(id_recibo)

        const resServicios = await fetch('/api/recibos/agregarServicios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'            },
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