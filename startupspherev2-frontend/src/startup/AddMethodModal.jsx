import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Edit, 
  Rocket, 
  GraduationCap, 
  FlaskConical, 
  ArrowLeft,
  X
} from 'lucide-react';

const TAILWIND_SAFELIST = "from-emerald-600 to-teal-600 bg-emerald-50/70 hover:bg-emerald-50 from-orange-600 to-amber-600 bg-amber-50/70 hover:bg-amber-50 from-amber-500 to-orange-600 bg-yellow-50/70 hover:bg-yellow-50 from-red-600 to-rose-600 bg-red-50/70 hover:bg-red-50 from-blue-600 to-indigo-600 bg-blue-50/70 hover:bg-blue-50 from-purple-600 to-pink-600 bg-purple-50/70 hover:bg-purple-50 from-sky-600 to-blue-700 bg-sky-50/70 hover:bg-sky-50";

const ECOSYSTEM_ACTORS = [
  {
    id: "ROLE_STARTUP",
    name: "Startup",
    desc: "Innovative ventures seeking scalability and growth",
    icon: Rocket,
    color: "from-blue-600 to-indigo-600",
    gradStart: "#2563eb",
    gradEnd: "#4f46e5",
    bgLight: "bg-blue-50/70 hover:bg-blue-50"
  },
  {
    id: "ROLE_HEI",
    name: "University / HEI",
    desc: "Higher Education Institutions driving research & talent",
    icon: GraduationCap,
    color: "from-emerald-600 to-teal-600",
    gradStart: "#059669",
    gradEnd: "#0d9488",
    bgLight: "bg-emerald-50/70 hover:bg-emerald-50"
  },
  {
    id: "ROLE_RESEARCH",
    name: "Research Institution",
    desc: "Organizations focused on scientific research and labs",
    icon: FlaskConical,
    color: "from-purple-600 to-pink-600",
    gradStart: "#9333ea",
    gradEnd: "#db2777",
    bgLight: "bg-purple-50/70 hover:bg-purple-50"
  }
];

const AddMethodModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedActor, setSelectedActor] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setSelectedActor(null);
    onClose();
  };

  const selectActor = (actor) => {
    setSelectedActor(actor);
    setStep(2);
  };

  const handleManualInput = () => {
    const actorId = selectedActor?.id;
    handleClose(); 
    navigate(`/add-startup?actor=${actorId}`);
  };

  const handleCsvFile = () => {
    const actorId = selectedActor?.id;
    handleClose();
    navigate(`/add-startup-csv?actor=${actorId}`); 
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"> 
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto p-6 md:p-8 border border-gray-100 relative overflow-hidden flex flex-col max-h-[90vh]"> 
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'linear-gradient(90deg, #2563eb, #4f46e5)' }}></div>

        {/* Modal Close */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all border-0 bg-transparent cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                Choose Ecosystem Actor Type
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">
                Select your stakeholder category to load the customized registration path.
              </p>
            </div>

            {/* Actors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-2 overflow-y-auto max-h-[55vh] flex-1 max-w-4xl mx-auto w-full">
              {ECOSYSTEM_ACTORS.map((actor) => {
                const IconComponent = actor.icon;
                return (
                  <button
                    key={actor.id}
                    onClick={() => selectActor(actor)}
                    className={`flex flex-col items-start text-left p-5 rounded-xl border-2 border-transparent transition-all shadow-sm hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 group cursor-pointer duration-200 ${actor.bgLight}`}
                  >
                    <div 
                      className="p-3 rounded-lg text-white mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200"
                      style={{ background: `linear-gradient(135deg, ${actor.gradStart}, ${actor.gradEnd})` }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {actor.name}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {actor.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            {/* Back Button */}
            <button
              onClick={() => setStep(1)}
              className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="text-center mb-8 max-w-lg mt-4">
              <div 
                className="inline-flex p-4 rounded-full text-white mb-4 shadow-md"
                style={{ background: `linear-gradient(135deg, ${selectedActor?.gradStart || '#2563eb'}, ${selectedActor?.gradEnd || '#4f46e5'})` }}
              >
                {React.createElement(selectedActor?.icon || Rocket, { className: "w-8 h-8" })}
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                Add New {selectedActor?.name}
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">
                Choose your preferred input method for registering this {selectedActor?.name.toLowerCase()}.
              </p>
            </div>

            {/* Methods Row */}
            <div className="flex flex-col md:flex-row gap-6 w-full px-6 flex-1 mb-4">
              <button
                onClick={handleManualInput}
                className="flex-1 flex flex-col items-center justify-center p-8 border border-gray-200 text-gray-900 bg-white rounded-xl hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-200 cursor-pointer group h-full min-h-[280px]"
              >
                <div 
                  className="p-5 rounded-full text-white mb-5 shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `linear-gradient(135deg, ${selectedActor?.gradStart || '#2563eb'}, ${selectedActor?.gradEnd || '#4f46e5'})` }}
                >
                  <Edit className="w-8 h-8" />
                </div>
                <span className="text-2xl font-bold mb-3">Manual Input</span>
                <span className="text-base text-gray-500 text-center font-medium leading-relaxed max-w-sm">
                  Step-by-step interactive form tailored for {selectedActor?.name.toLowerCase()} listings
                </span>
              </button>

              <button
                onClick={handleCsvFile}
                className="flex-1 flex flex-col items-center justify-center p-8 border border-gray-200 text-gray-900 bg-white rounded-xl hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300 transition-all duration-200 cursor-pointer group h-full min-h-[280px]"   
              >
                <div 
                  className="p-5 rounded-full text-white mb-5 shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
                >
                  <FileText className="w-8 h-8" />
                </div>
                <span className="text-2xl font-bold mb-3">CSV File Upload</span>
                <span className="text-base text-gray-500 text-center font-medium leading-relaxed max-w-sm">
                  Bulk import many records at once using our Excel or CSV spreadsheet templates
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMethodModal;