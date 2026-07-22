import { api } from "./api";
import { unwrapData, unwrapList, unwrapPaged } from "../utils/apiResponse";
import type {
  CreateRadioHandoverPayload,
  RadioHandoverDetail,
  RadioHandoverList,
  RadioLookup,
  UserOption,
} from "../types/radioHandover";

export const radioHandoverApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get("/api/radio-handovers", { params }).then((r) => unwrapPaged<RadioHandoverList>(r)),

  getById: (id: number) =>
    api.get(`/api/radio-handovers/${id}`).then((r) => {
      const data = unwrapData<RadioHandoverDetail>(r);
      if (!data) throw new Error("Serah terima tidak ditemukan");
      return data;
    }),

  create: (payload: CreateRadioHandoverPayload) =>
    api.post("/api/radio-handovers", payload).then((r) => unwrapData<RadioHandoverDetail>(r)!),

  getTechnicians: () =>
    api.get("/api/radio-handovers/technicians").then((r) => unwrapList<UserOption>(r)),

  getWarehouseReceivers: () =>
    api.get("/api/radio-handovers/warehouse-receivers").then((r) => unwrapList<UserOption>(r)),

  getHelpdeskReceivers: () =>
    api.get("/api/radio-handovers/helpdesk-receivers").then((r) => unwrapList<UserOption>(r)),

  completeReceiverSignature: (id: number, receiverSignatureBase64: string, picReceiverName?: string, remarks?: string) =>
    api
      .patch(`/api/radio-handovers/${id}/complete-receiver-signature`, { receiverSignatureBase64, picReceiverName, remarks })
      .then((r) => unwrapData<RadioHandoverDetail>(r)!),

  lookupBySerial: (serialNumber: string) =>
    api
      .get("/api/radios/lookup-by-serial", { params: { serialNumber } })
      .then((r) => unwrapList<RadioLookup>(r)),

  getThumbnails: (ids: number[]) =>
    ids.length === 0
      ? Promise.resolve({} as Record<number, string>)
      : api
          .get("/api/radio-handovers/thumbnails", { params: { ids: ids.join(",") } })
          .then((r) => unwrapData<Record<number, string>>(r) ?? {}),

  update: (id: number, payload: Partial<CreateRadioHandoverPayload> & { remarks?: string | null }) =>
    api.patch(`/api/radio-handovers/${id}`, payload).then((r) => unwrapData<RadioHandoverDetail>(r)!),

  resetReceiverSignature: (id: number) =>
    api.patch(`/api/radio-handovers/${id}/reset-receiver-signature`).then((r) => unwrapData<RadioHandoverDetail>(r)!),

  softDelete: (id: number) => api.delete(`/api/radio-handovers/${id}`),

  restore: (id: number) => api.patch(`/api/radio-handovers/${id}/restore`),

  deletePermanent: (id: number) => api.delete(`/api/radio-handovers/${id}/permanent`),
};
