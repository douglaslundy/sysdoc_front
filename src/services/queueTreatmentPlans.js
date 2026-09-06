import { api } from './api';

export const previewTreatmentPlan = (specialityId, weekdays, totalSessions) =>
    api.post('/queue-treatment-plans/preview', {
        speciality_id: specialityId,
        weekdays,
        total_sessions: totalSessions,
    }).then((res) => res.data);

export const createTreatmentPlan = (queueId, weekdays, totalSessions) =>
    api.post('/queue-treatment-plans', {
        queue_id: queueId,
        weekdays,
        total_sessions: totalSessions,
    }).then((res) => res.data);

export const getTreatmentPlanForQueue = (queueId) =>
    api.get(`/queues/${queueId}/treatment-plan`).then((res) => res.data);

export const rescheduleTreatmentSession = (sessionId, newDate, reason) =>
    api.put(`/queue-treatment-sessions/${sessionId}/reschedule`, {
        new_date: newDate,
        reason,
    }).then((res) => res.data);

export const completeTreatmentSession = (sessionId) =>
    api.put(`/queue-treatment-sessions/${sessionId}/complete`).then((res) => res.data);

export const cancelTreatmentPlan = (planId, reason) =>
    api.put(`/queue-treatment-plans/${planId}/cancel`, { reason }).then((res) => res.data);
