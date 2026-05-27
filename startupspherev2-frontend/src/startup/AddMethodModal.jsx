import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Edit, 
  Rocket, 
  GraduationCap, 
  Briefcase, 
  FlaskConical, 
  Lightbulb, 
  Handshake, 
  Landmark, 
  ArrowLeft, 
  X 
} from 'lucide-react';

const ECOSYSTEM_ACTORS = [
  {
    id: "ROLE_STARTUP",
    name: "Startup",
    desc: "Innovative ventures seeking scalability and growth",
    icon: Rocket,
    color: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50/70 hover:bg-blue-50"
  },
  {
    id: "ROLE_HEI",
    name: "University / HEI",
    desc: "Higher Education Institutions driving research & talent",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50/70 hover:bg-emerald-50"
  },
  {
    id: "ROLE_SME",
    name: "SME / Business",
    desc: "Small & medium enterprises driving regional trade",
    icon: Briefcase,
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50/70 hover:bg-amber-50"
  },
  {
    id: "ROLE_RESEARCH",
    name: "Research Institution",
    desc: "Organizations focused on scientific research and labs",
    icon: FlaskConical,
    color: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50/70 hover:bg-purple-50"
  },
  {
    id: "ROLE_INNOVATION",
    name: "Innovation Output",
    desc: "Patented tech, intellectual property, and spinoffs",
    icon: Lightbulb,
    color: "from-yellow-500 to-amber-500",
    bgLight: "bg-yellow-50/70 hover:bg-yellow-50"
  },
  {
    id: "ROLE_SUPPORT",
    name: "Support Organization",
    desc: "Incubators, accelerators, and business support systems",
    icon: Handshake,
    color: "from-red-500 to-rose-500",
    bgLight: "bg-red-50/70 hover:bg-red-50"
  },
  {
    id: "ROLE_GOVERNMENT",
    name: "Government / Funding",
    desc: "State bodies providing grants, policies, and funds",
    icon: Landmark,
    color: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50/70 hover:bg-sky-50"
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
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1 overflow-y-auto max-h-[55vh] flex-1 pr-2">
              {ECOSYSTEM_ACTORS.map((actor) => {
                const IconComponent = actor.icon;
                return (
                  <button
                    key={actor.id}
                    onClick={() => selectActor(actor)}
                    className={`flex flex-col items-start text-left p-5 rounded-xl border-2 border-gray-200 transition-all shadow-sm hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 group cursor-pointer duration-200 ${actor.bgLight}`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${actor.color} text-white mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
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
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${selectedActor?.color} text-white mb-4 shadow-md`}>
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
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl px-4">
              <button
                onClick={handleManualInput}
                className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-gray-200 text-blue-900 rounded-xl hover:bg-blue-50/50 hover:border-blue-500 hover:ring-4 hover:ring-blue-100 transition-all duration-200 shadow-sm cursor-pointer group"
              >
                <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4 group-hover:scale-105 transition-transform">
                  <Edit className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold">Manual Input</span>
                <span className="text-sm text-gray-500 mt-1.5 text-center font-medium">
                  Step-by-step interactive form tailored for {selectedActor?.name.toLowerCase()} listings
                </span>
              </button>

              <button
                onClick={handleCsvFile}
                className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-gray-200 text-blue-900 rounded-xl hover:bg-blue-50/50 hover:border-blue-500 hover:ring-4 hover:ring-blue-100 transition-all duration-200 shadow-sm cursor-pointer group"   
              >
                <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4 group-hover:scale-105 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold">CSV File Upload</span>
                <span className="text-sm text-gray-500 mt-1.5 text-center font-medium">
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