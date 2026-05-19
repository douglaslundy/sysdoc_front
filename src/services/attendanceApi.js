import { api } from "./api";

export const attendanceApi = {
  listRooms: () => api.get("/attendance/rooms"),
  listRoomsAdmin: () => api.get("/attendance/rooms-admin"),
  createRoom: (payload) => api.post("/attendance/rooms-admin", payload),
  updateRoom: (roomId, payload) => api.put(`/attendance/rooms-admin/${roomId}`, payload),
  inactivateRoom: (roomId) => api.patch(`/attendance/rooms-admin/${roomId}/inactivate`),
  deleteRoom: (roomId) => api.delete(`/attendance/rooms-admin/${roomId}`),
  listClients: () => api.get("/clients"),
  createTicket: (payload) => api.post("/attendance/tickets", payload),
  listTickets: (params) => api.get("/attendance/tickets", { params }),
  listQueue: () => api.get("/attendance/queue"),
  callNext: (payload) => api.post("/attendance/queue/call-next", payload),
  callSpecific: (ticketId, payload) => api.post(`/attendance/queue/${ticketId}/call`, payload),
  getServiceData: (ticketId) => api.get(`/attendance/service/${ticketId}`),
  startService: (ticketId) => api.post(`/attendance/service/${ticketId}/start`),
  saveNotes: (ticketId, payload) => api.patch(`/attendance/service/${ticketId}/notes`, payload),
  finishService: (ticketId, payload) => api.post(`/attendance/service/${ticketId}/finish`, payload),
  noShowTicket: (ticketId) => api.patch(`/attendance/tickets/${ticketId}/no-show`),
  cancelTicket: (ticketId) => api.patch(`/attendance/tickets/${ticketId}/cancel`),
  getPanelState: () => api.get("/attendance/panel/state"),
};
