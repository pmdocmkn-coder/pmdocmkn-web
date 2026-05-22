import { useEffect, useState } from "react";

import SignaturePadField from "../common/SignaturePadField";

import { radioHandoverApi } from "../../services/radioHandoverApi";

import type { RadioRepairJobDetail } from "../../types/radioRepair";

import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";

import { useToast } from "../../hooks/use-toast";

import HandoverAccessoryList from "./HandoverAccessoryList";

import MultiPhotoUpload from "./MultiPhotoUpload";



type Props = {

  job: RadioRepairJobDetail;

  onSuccess: () => void;

  onCancel: () => void;

};



export default function TechnicianToWarehouseForm({ job, onSuccess, onCancel }: Props) {

  const { toast } = useToast();

  const [receivers, setReceivers] = useState<UserOption[]>([]);

  const [whId, setWhId] = useState("");

  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>([]);

  const [photos, setPhotos] = useState<string[]>([]);

  const [sigTech, setSigTech] = useState<string | null>(null);

  const [sigWh, setSigWh] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {

    radioHandoverApi

      .getWarehouseReceivers()

      .then((list) => setReceivers(list ?? []))

      .catch(() => setReceivers([]));

  }, []);



  const submit = async () => {

    const acc = accessories.filter((a) => a.itemName.trim());

    if (!whId || photos.length === 0 || !sigTech || !sigWh) {

      toast({ title: "Lengkapi foto, TTD teknisi & warehouse", variant: "destructive" });

      return;

    }

    setSubmitting(true);

    try {

      await radioHandoverApi.create({

        handoverType: "TechnicianToWarehouse",

        radioRepairJobId: job.id,

        radioId: job.radioId ?? undefined,

        radioSerialNumber: job.radioSerialNumber,

        batterySerialNumber: job.batterySerialNumber ?? undefined,

        receivedByUserId: Number(whId),

        radioPhotos: photos,

        handedOverSignatureBase64: sigTech,

        receiverSignatureBase64: sigWh,

        accessories: acc,

      });

      toast({ title: "Serah terima ke warehouse berhasil" });

      onSuccess();

    } catch {

      toast({ title: "Gagal menyimpan", variant: "destructive" });

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <div className="space-y-4">

      <p className="text-sm text-gray-600">

        Job <strong>{job.jobNumber}</strong> — SN {job.radioSerialNumber}

      </p>

      <div>

        <label className="text-sm font-medium">Penerima Warehouse *</label>

        <select className="w-full border rounded-lg px-3 py-2 mt-1" value={whId} onChange={(e) => setWhId(e.target.value)}>

          <option value="">Pilih staff warehouse</option>

          {(receivers ?? []).map((r) => (

            <option key={r.userId} value={r.userId}>{r.fullName}</option>

          ))}

        </select>

      </div>

      <MultiPhotoUpload photos={photos} onChange={setPhotos} required />

      <HandoverAccessoryList items={accessories} onChange={setAccessories} />

      <SignaturePadField label="TTD Teknisi (penyerah)" required value={sigTech} onChange={setSigTech} />

      <SignaturePadField label="TTD Warehouse (penerima)" required value={sigWh} onChange={setSigWh} />

      <div className="flex gap-2 justify-end">

        <button type="button" className="px-4 py-2 border rounded-lg" onClick={onCancel}>Batal</button>

        <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg" disabled={submitting} onClick={submit}>

          {submitting ? "..." : "Serah Terima"}

        </button>

      </div>

    </div>

  );

}

