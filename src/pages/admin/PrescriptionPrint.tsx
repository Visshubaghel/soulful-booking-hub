import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PrescriptionPrint() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppt = async () => {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAppt();
  }, [id]);

  useEffect(() => {
    if (!loading && appointment) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, appointment]);

  if (loading) return <div className="p-10 font-body">Loading prescription layout...</div>;
  if (!appointment) return <div className="p-10 font-body text-red-500">Failed to load appointment details.</div>;

  return (
    <div className="bg-white text-black min-h-screen font-body print:p-0 p-8 flex justify-center">
      <div 
        className="bg-white border border-gray-200 shadow-xl print:shadow-none print:border-none w-[210mm] min-h-[297mm] p-[20mm] flex flex-col"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-heading font-bold text-emerald-700">Vishwas Skin Clinic</h1>
            <p className="text-gray-600 font-medium tracking-wide">Where Science Meets Beauty</p>
            <p className="text-sm mt-3 text-gray-500">123 Skin Care Road, New Delhi, India - 110001</p>
            <p className="text-sm text-gray-500">Phone: +91 123 456 7890 | Web: radianceclinic.com</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Date: {appointment.date || new Date().toISOString().split('T')[0]}</p>
            <p className="text-xs text-gray-500 mt-1">Ref ID: {appointment._id?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-emerald-50 rounded-lg p-5 mb-8 border border-emerald-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Patient Name</p>
            <p className="font-semibold text-lg">{appointment.patientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Patient ID</p>
            <p className="font-semibold text-lg">{appointment.patientId?.patientId || "N/A"}</p>
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="font-medium">{appointment.age || "--"} Years</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-medium">{appointment.gender || "--"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Contact</p>
              <p className="font-medium">{appointment.patientPhone || "--"}</p>
            </div>
          </div>
          <div className="col-span-2 border-t border-emerald-100 pt-3 mt-1">
            <p className="text-xs text-gray-500">Symptoms / Reason</p>
            <p className="font-medium text-gray-800">{appointment.symptoms || "N/A"}</p>
          </div>
        </div>

        {/* Rx Area */}
        <div className="flex-1 relative">
          <h2 className="text-3xl font-heading font-bold text-emerald-800 mb-6 italic">Rx</h2>
          
          <div className="w-full h-full min-h-[400px]">
            {/* Blank space for Doctor to write manually */}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-6 mt-8 flex justify-between items-end">
          <div className="text-xs text-gray-500">
            <p>Not valid for medico-legal purposes.</p>
            <p>Please bring this prescription on your next visit.</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-gray-400 mb-2 h-10"></div>
            <p className="text-sm font-semibold">Doctor's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
