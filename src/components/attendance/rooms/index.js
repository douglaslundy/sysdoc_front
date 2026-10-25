import React, { useEffect, useState } from "react";
import { attendanceApi } from "../../../services/attendanceApi";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CampoTexto } from "../../ui/campos";
import { EstadoVazio } from "../../ui/estado-vazio";
import { Pilula } from "../../ui/pilula";

const initialForm = { id: null, name: "", description: "", active: true };

export default function AttendanceRooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRooms = async () => {
    const { data } = await attendanceApi.listRoomsAdmin();
    setRooms(data || []);
  };

  useEffect(() => {
    loadRooms().catch(() => setError("Não foi possível carregar as salas."));
  }, []);

  const onSubmit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (form.id) {
        await attendanceApi.updateRoom(form.id, {
          name: form.name,
          description: form.description,
          active: form.active,
        });
      } else {
        await attendanceApi.createRoom({
          name: form.name,
          description: form.description,
          active: true,
        });
      }
      setForm(initialForm);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao salvar sala.");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (room) => setForm({
    id: room.id,
    name: room.name || "",
    description: room.description || "",
    active: !!room.active,
  });

  const onInactivate = async (roomId) => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.inactivateRoom(roomId);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao inativar sala.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (roomId) => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.deleteRoom(roomId);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao remover sala.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salas de Atendimento</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-[260px]">
            <CampoTexto id="sala-nome" label="Nome da sala" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="w-full sm:w-[320px]">
            <CampoTexto id="sala-descricao" label="Descrição" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <Button onClick={onSubmit} disabled={loading || !form.name.trim()}>
            {form.id ? "Atualizar" : "Criar sala"}
          </Button>
          {form.id ? (
            <Button variant="outline" onClick={() => setForm(initialForm)} disabled={loading}>
              Cancelar edição
            </Button>
          ) : null}
        </div>

        {error ? <Banner tom="perigo">{error}</Banner> : null}

        {rooms.length === 0 ? (
          <EstadoVazio titulo="Nenhuma sala cadastrada." />
        ) : (
          <ul className="divide-y divide-border">
            {rooms.map((room) => (
              <li key={room.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{room.name}</p>
                  <p className="text-sm text-muted-foreground">{room.description || "-"}</p>
                  <div className="mt-1">
                    <Pilula tom={room.active ? "sucesso" : "neutro"}>{room.active ? "Ativa" : "Inativa"}</Pilula>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => onEdit(room)} disabled={loading}>
                    Editar
                  </Button>
                  {room.active ? (
                    <Button variant="secondary" onClick={() => onInactivate(room.id)} disabled={loading}>
                      Inativar
                    </Button>
                  ) : null}
                  <Button variant="destructive" onClick={() => onDelete(room.id)} disabled={loading}>
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
