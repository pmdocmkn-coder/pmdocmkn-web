import HelpdeskToTechnicianWizard from "./HelpdeskToTechnicianWizard";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

/** Form HD→Tek dengan wizard: pilih tag, bulk SN, detail, TTD. */
export default function HelpdeskToTechnicianForm(props: Props) {
  return <HelpdeskToTechnicianWizard {...props} />;
}
