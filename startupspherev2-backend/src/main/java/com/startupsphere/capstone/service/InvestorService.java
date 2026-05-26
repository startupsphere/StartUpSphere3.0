package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.repository.InvestorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InvestorService {

    private final InvestorRepository investorRepository;

    public InvestorService(InvestorRepository investorRepository) {
        this.investorRepository = investorRepository;
    }

    public Page<Investor> getAllInvestors(Pageable pageable) {
        return investorRepository.findAll(pageable);
    }

    public List<Investor> getAllInvestors() {
        return (List<Investor>) investorRepository.findAll();
    }

    public Investor getInvestorById(Integer id) {
        return investorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investor not found with ID: " + id));
    }

    public Investor createInvestor(Investor investor) {
        return investorRepository.save(investor);
    }

    public Investor updateInvestor(Integer id, Investor updatedInvestor) {
        return investorRepository.findById(id)
                .map(investor -> {
                    investor.setFirstname(updatedInvestor.getFirstname());
                    investor.setLastname(updatedInvestor.getLastname());
                    investor.setEmailAddress(updatedInvestor.getEmailAddress());
                    investor.setContactInformation(updatedInvestor.getContactInformation());
                    investor.setGender(updatedInvestor.getGender());
                    investor.setWebsite(updatedInvestor.getWebsite());
                    investor.setFacebook(updatedInvestor.getFacebook());
                    investor.setTwitter(updatedInvestor.getTwitter());
                    investor.setInstagram(updatedInvestor.getInstagram());
                    investor.setLinkedin(updatedInvestor.getLinkedin());
                    investor.setBiography(updatedInvestor.getBiography());
                    investor.setLocationLat(updatedInvestor.getLocationLat());
                    investor.setLocationLang(updatedInvestor.getLocationLang());
                    investor.setLocationName(updatedInvestor.getLocationName());
                /*  investor.setLikes(updatedInvestor.getLikes());
                    investor.setBookmarks(updatedInvestor.getBookmarks());
                    investor.setViews(updatedInvestor.getViews()); */
                    investor.setUserId(updatedInvestor.getUserId());
                    investor.setDeleted(updatedInvestor.isDeleted());
                    return investorRepository.save(investor);
                }).orElseThrow(() -> new RuntimeException("Investor not found with ID: " + id));
    }

    public void deleteInvestor(Integer id) {
        investorRepository.deleteById(id);
    }

    public List<Investor> searchInvestors(String query) {
        return investorRepository.findByFirstnameContainingIgnoreCaseOrLastnameContainingIgnoreCase(query, query);
    }

    public int getViewsByUserId(Integer userId) {
        Investor investor = investorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Investor not found with userId: " + userId));
        return investor.getViews();
    }

    public void incrementViewsByUserId(Integer userId) {
        Investor investor = investorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Investor not found with userId: " + userId));
        investor.setViews(investor.getViews() + 1);
        investorRepository.save(investor);
    }
}
