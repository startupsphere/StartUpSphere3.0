const fs = require('fs');

function replaceExact(file, searchStr, replaceStr) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\r\n/g, '\n');
  const index = code.indexOf(searchStr);
  if (index === -1) {
    console.error("Could not find exact string in " + file + ":\n" + searchStr);
    return false;
  }
  code = code.substring(0, index) + replaceStr + code.substring(index + searchStr.length);
  fs.writeFileSync(file, code);
  return true;
}

// 1. StartupRepository
const startupRepoPath = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-backend/src/main/java/com/startupsphere/capstone/repository/StartupRepository.java';
const oldStartupRepo = `    Page<Startup> findByCompanyNameContainingIgnoreCase(String query, Pageable pageable);
    List<Startup> findByCompanyNameContainingIgnoreCase(String query);`;

const newStartupRepo = `    @Query("SELECT s FROM Startup s WHERE " +
           "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.industry) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.companyDescription) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.businessActivity) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Startup> searchAllFields(@Param("query") String query, Pageable pageable);

    @Query("SELECT s FROM Startup s WHERE " +
           "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.industry) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.companyDescription) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.businessActivity) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Startup> searchAllFields(@Param("query") String query);`;

replaceExact(startupRepoPath, oldStartupRepo, newStartupRepo);

// 2. StartupService
const startupServicePath = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-backend/src/main/java/com/startupsphere/capstone/service/StartupService.java';
const oldStartupService1 = `    public Page<Startup> searchStartups(String query, Pageable pageable) {
        return startupRepository.findByCompanyNameContainingIgnoreCase(query, pageable);
    }`;
const newStartupService1 = `    public Page<Startup> searchStartups(String query, Pageable pageable) {
        return startupRepository.searchAllFields(query, pageable);
    }`;
replaceExact(startupServicePath, oldStartupService1, newStartupService1);

const oldStartupService2 = `    public List<Startup> searchStartups(String query) {
        return startupRepository.findByCompanyNameContainingIgnoreCase(query);
    }`;
const newStartupService2 = `    public List<Startup> searchStartups(String query) {
        return startupRepository.searchAllFields(query);
    }`;
replaceExact(startupServicePath, oldStartupService2, newStartupService2);


// 3. InvestorRepository
const investorRepoPath = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-backend/src/main/java/com/startupsphere/capstone/repository/InvestorRepository.java';
const oldInvestorRepo = `    Page<Investor> findByFirstnameContainingIgnoreCaseOrLastnameContainingIgnoreCase(String firstname, String lastname, Pageable pageable);
    List<Investor> findByFirstnameContainingIgnoreCaseOrLastnameContainingIgnoreCase(String firstname, String lastname);`;

const newInvestorRepo = `    @Query("SELECT i FROM Investor i WHERE " +
           "LOWER(i.firstname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.lastname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.biography) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Investor> searchAllFields(@Param("query") String query, Pageable pageable);

    @Query("SELECT i FROM Investor i WHERE " +
           "LOWER(i.firstname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.lastname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.biography) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Investor> searchAllFields(@Param("query") String query);`;
replaceExact(investorRepoPath, oldInvestorRepo, newInvestorRepo);


// 4. InvestorService
const investorServicePath = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-backend/src/main/java/com/startupsphere/capstone/service/InvestorService.java';
const oldInvestorService = `    public List<Investor> searchInvestors(String query) {
        return investorRepository.findByFirstnameContainingIgnoreCaseOrLastnameContainingIgnoreCase(query, query);
    }`;
const newInvestorService = `    public List<Investor> searchInvestors(String query) {
        return investorRepository.searchAllFields(query);
    }`;
replaceExact(investorServicePath, oldInvestorService, newInvestorService);

console.log("Backend search fields updated successfully!");
