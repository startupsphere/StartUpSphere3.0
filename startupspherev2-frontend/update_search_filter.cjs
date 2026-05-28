const fs = require('fs');
const file = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-frontend/src/sidebar/Sidebar.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/\r\n/g, '\n');

function replaceExact(searchStr, replaceStr) {
  const index = code.indexOf(searchStr);
  if (index === -1) throw new Error("Could not find exact string:\n" + searchStr);
  code = code.substring(0, index) + replaceStr + code.substring(index + searchStr.length);
}

// 1. Update filters state initialization
const oldFiltersState = `  const [filters, setFilters] = useState({
    startups: {
      query: "",
      industry: "",
      customIndustry: "",
      foundedDate: "",
      teamSize: "",
      fundingStage: "",
      actorType: "All",
    },
    stakeholders: {
      query: "",
      actorType: "All",
    },
  });`;

const newFiltersState = `  const [filters, setFilters] = useState({
    startups: {
      query: "",
      searchField: "All",
      industry: "",
      customIndustry: "",
      foundedDate: "",
      teamSize: "",
      fundingStage: "",
      actorType: "All",
    },
    stakeholders: {
      query: "",
      searchField: "All",
      actorType: "All",
    },
  });`;

if (code.includes('const [filters, setFilters] = useState({') && !code.includes('searchField: "All"')) {
  replaceExact(oldFiltersState, newFiltersState);
}

// 2. Update applyFilters logic
const oldApplyFilters = `        const query = currentFilters.query.trim();
        const matchesQuery = !query || (viewingType === "startups" ? 
            ["companyName", "industry", "companyDescription", "city", "status", "businessActivity", "foundedDate"].some(f => safeFieldCheck(item[f], query)) :
            ["name", "email", "region", "organization", "city", "province", "sector", "biography", "phoneNumber", "linkedIn", "facebook"].some(f => safeFieldCheck(item[f], query)));`;

const newApplyFilters = `        const query = currentFilters.query.trim();
        const searchField = currentFilters.searchField || "All";
        
        const startupFields = ["companyName", "industry", "companyDescription", "city", "status", "businessActivity", "foundedDate"];
        const stakeholderFields = ["name", "email", "region", "organization", "city", "province", "sector", "biography", "phoneNumber", "linkedIn", "facebook"];
        
        const fieldsToCheck = searchField === "All" 
          ? (viewingType === "startups" ? startupFields : stakeholderFields) 
          : [searchField];

        const matchesQuery = !query || fieldsToCheck.some(f => safeFieldCheck(item[f], query));`;

if (code.includes('const query = currentFilters.query.trim();') && !code.includes('const searchField = currentFilters.searchField || "All";')) {
  replaceExact(oldApplyFilters, newApplyFilters);
}

// 3. Add the UI dropdown under actorType
const oldUIRegex = /\{\s*viewingType === "startups" && \(\s*<div className="mt-3">\s*<select\s*value=\{filters\.startups\.actorType \|\| "All"\}[\s\S]*?<\/div>\s*\)\s*\}/m;

const newUI = `{viewingType === "startups" && (
                <div className="mt-3">
                  <select
                    value={filters.startups.actorType || "All"}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        startups: { ...prev.startups, actorType: value },
                      }));
                    }}
                    className="bg-white/95 border border-transparent text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent block w-full p-2 shadow-sm"
                  >
                    <option value="All">All Innovation Types</option>
                    <option value="ROLE_STARTUP">Startup</option>
                    <option value="ROLE_HEI">University / HEI</option>
                    <option value="ROLE_RESEARCH">Research Institution</option>
                  </select>
                </div>
              )}

              <div className="mt-3">
                <select
                  value={
                    (viewingType === "startups"
                      ? filters.startups.searchField
                      : filters.stakeholders.searchField) || "All"
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      [viewingType]: { ...prev[viewingType], searchField: value },
                    }));
                  }}
                  className="bg-white/95 border border-transparent text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent block w-full p-2 shadow-sm"
                >
                  <option value="All">Search In: All Fields</option>
                  {viewingType === "startups" ? (
                    <>
                      <option value="companyName">Company Name</option>
                      <option value="industry">Industry</option>
                      <option value="companyDescription">Description</option>
                      <option value="city">City</option>
                    </>
                  ) : (
                    <>
                      <option value="name">Name</option>
                      <option value="organization">Organization</option>
                      <option value="sector">Sector</option>
                      <option value="biography">Biography</option>
                    </>
                  )}
                </select>
              </div>`;

if (!code.includes('Search In: All Fields')) {
  code = code.replace(oldUIRegex, newUI);
}

fs.writeFileSync(file, code);
console.log("Success! Updated Sidebar.jsx to support searchField filtering.");
