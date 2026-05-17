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

    async function sendData(){
        const res = await fetch('/api/recibos/agregarServicios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'            },
            body: JSON.stringify({
                consultas: listaNuevaConsulta,
                estudios: listaNuevoEstudio
            })
        })
        if (res.ok){
            alert(JSON.stringify(await res.json()))
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