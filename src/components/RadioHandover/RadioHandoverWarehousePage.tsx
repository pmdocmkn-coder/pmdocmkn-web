import { useCallback, useEffect, useState } from "react";

import { format } from "date-fns";

import { id as localeId } from "date-fns/locale";

import { Warehouse, ArrowRight } from "lucide-react";

import { radioHandoverApi } from "../../services/radioHandoverApi";

import { radioRepairApi } from "../../services/radioRepairApi";

import type { RadioHandoverList, RadioHandoverDetail } from "../../types/radioHandover";

import type { RadioRepairJobList } from "../../types/radioRepair";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

import SignaturePadField from "../common/SignaturePadField";

import WarehouseToHelpdeskForm from "./WarehouseToHelpdeskForm";

import { canCreateHandoverWhHd } from "../../utils/handoverPermissions";



function handoverTypeLabel(t: string) {

  if (t === "HelpdeskToTechnician") return "HD→Tek";

  if (t === "TechnicianToWarehouse") return "Tek→WH";

  if (t === "WarehouseToHelpdesk") return "WH→HD";

  return t;

}



export default function RadioHandoverWarehousePage() {

  const [incoming, setIncoming] = useState<RadioHandoverList[]>([]);

  const [pendingJobs, setPendingJobs] = useState<RadioRepairJobList[]>([]);

  const [detail, setDetail] = useState<RadioHandoverDetail | null>(null);

  const [returnJob, setReturnJob] = useState<RadioRepairJobList | null>(null);



  const load = useCallback(() => {

    radioHandoverApi

      .getAll({ page: 1, pageSize: 50, handoverType: "TechnicianToWarehouse" })

      .then((r) => setIncoming(r.data ?? []))

      .catch(() => setIncoming([]));



    radioRepairApi

      .getAll({ page: 1, pageSize: 50, status: "HandedToWarehouse" })

      .then((r) => setPendingJobs(r.data ?? []))

      .catch(() => setPendingJobs([]));

  }, []);



  useEffect(() => {

    load();

  }, [load]);



  return (

    <div className="p-6 space-y-8">

      <h1 className="text-2xl font-bold flex items-center gap-2">

        <Warehouse className="w-7 h-7 text-violet-600" />

        Warehouse — Serah Terima Radio

      </h1>



      {canCreateHandoverWhHd() && pendingJobs.length > 0 && (

        <section className="space-y-3">

          <h2 className="text-lg font-semibold text-gray-800">Siap serah ke Helpdesk</h2>

          <p className="text-sm text-gray-500">

            Radio sudah diterima dari teknisi. Lengkapi foto, aksesoris, dan TTD Warehouse + Helpdesk.

          </p>

          <div className="bg-white rounded-xl border overflow-hidden">

            <table className="w-full text-sm">

              <thead className="bg-amber-50">

                <tr>

                  <th className="text-left px-4 py-3">Job</th>

                  <th className="text-left px-4 py-3">Tiket</th>

                  <th className="text-left px-4 py-3">SN</th>

                  <th className="text-left px-4 py-3">Teknisi</th>

                  <th className="text-right px-4 py-3">Aksi</th>

                </tr>

              </thead>

              <tbody>

                {pendingJobs.map((j) => (

                  <tr key={j.id} className="border-t">

                    <td className="px-4 py-3 font-mono text-xs">{j.jobNumber}</td>

                    <td className="px-4 py-3">{j.helpdeskTicketNumber}</td>

                    <td className="px-4 py-3">{j.radioSerialNumber}</td>

                    <td className="px-4 py-3">{j.assignedTechnicianName}</td>

                    <td className="px-4 py-3 text-right">

                      <button

                        type="button"

                        onClick={() => setReturnJob(j)}

                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700"

                      >

                        <ArrowRight className="w-3.5 h-3.5" /> WH ke Helpdesk

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

      )}



      <section className="space-y-3">

        <h2 className="text-lg font-semibold text-gray-800">Histori masuk dari Teknisi</h2>

        <div className="bg-white rounded-xl border overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-4 py-3">STR</th>

                <th className="text-left px-4 py-3">Job</th>

                <th className="text-left px-4 py-3">SN</th>

                <th className="text-left px-4 py-3">Teknisi → WH</th>

                <th className="text-left px-4 py-3">Tanggal</th>

              </tr>

            </thead>

            <tbody>

              {incoming.length === 0 && (

                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada data</td></tr>

              )}

              {incoming.map((h) => (

                <tr

                  key={h.id}

                  className="border-t hover:bg-violet-50/40 cursor-pointer"

                  onClick={() => radioHandoverApi.getById(h.id).then(setDetail)}

                >

                  <td className="px-4 py-3 font-mono text-xs">{h.handoverNumber}</td>

                  <td className="px-4 py-3">{h.jobNumber}</td>

                  <td className="px-4 py-3">{h.radioSerialNumber}</td>

                  <td className="px-4 py-3">{h.handedOverByName} → {h.receivedByName}</td>

                  <td className="px-4 py-3">{format(new Date(h.handoverAt), "dd MMM yyyy", { locale: localeId })}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>



      <section className="space-y-3">

        <h2 className="text-lg font-semibold text-gray-800">Histori serah ke Helpdesk</h2>

        <ReturnedToHelpdeskList onOpenDetail={setDetail} />

      </section>



      {returnJob && (

        <Dialog open={!!returnJob} onOpenChange={() => setReturnJob(null)}>

          <DialogContent className="max-w-2xl">

            <DialogHeader>

              <DialogTitle>Serah Terima Warehouse → Helpdesk</DialogTitle>

            </DialogHeader>

            <WarehouseToHelpdeskForm

              job={returnJob}

              onSuccess={() => {

                setReturnJob(null);

                load();

              }}

              onCancel={() => setReturnJob(null)}

            />

          </DialogContent>

        </Dialog>

      )}



      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>

              {detail?.handoverNumber} ({handoverTypeLabel(detail?.handoverType ?? "")})

            </DialogTitle>

          </DialogHeader>

          {detail && (

            <div className="space-y-3 text-sm">

              <p>Status job: {detail.jobStatus}</p>

              {(detail.radioPhotos?.length ? detail.radioPhotos : detail.radioPhotoBase64 ? [detail.radioPhotoBase64] : []).map((src, i) => (

                <img key={i} src={src} alt={`foto ${i + 1}`} className="max-h-40 rounded border" />

              ))}

              <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} />

              <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} />

            </div>

          )}

        </DialogContent>

      </Dialog>

    </div>

  );

}



function ReturnedToHelpdeskList({ onOpenDetail }: { onOpenDetail: (d: RadioHandoverDetail) => void }) {

  const [items, setItems] = useState<RadioHandoverList[]>([]);



  useEffect(() => {

    radioHandoverApi

      .getAll({ page: 1, pageSize: 50, handoverType: "WarehouseToHelpdesk" })

      .then((r) => setItems(r.data ?? []))

      .catch(() => setItems([]));

  }, []);



  return (

    <div className="bg-white rounded-xl border overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-50">

          <tr>

            <th className="text-left px-4 py-3">STR</th>

            <th className="text-left px-4 py-3">Job</th>

            <th className="text-left px-4 py-3">SN</th>

            <th className="text-left px-4 py-3">WH → HD</th>

            <th className="text-left px-4 py-3">Tanggal</th>

          </tr>

        </thead>

        <tbody>

          {items.length === 0 && (

            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada data</td></tr>

          )}

          {items.map((h) => (

            <tr

              key={h.id}

              className="border-t hover:bg-indigo-50/40 cursor-pointer"

              onClick={() => radioHandoverApi.getById(h.id).then(onOpenDetail)}

            >

              <td className="px-4 py-3 font-mono text-xs">{h.handoverNumber}</td>

              <td className="px-4 py-3">{h.jobNumber}</td>

              <td className="px-4 py-3">{h.radioSerialNumber}</td>

              <td className="px-4 py-3">{h.handedOverByName} → {h.receivedByName}</td>

              <td className="px-4 py-3">{format(new Date(h.handoverAt), "dd MMM yyyy", { locale: localeId })}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

