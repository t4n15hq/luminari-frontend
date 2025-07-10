import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InteractiveRegulatoryMap = ({ onCountrySelect }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Comprehensive regional data with regulatory documentation for each country
  const regions = {
    "north-america": {
      name: "North America",
      countries: [
        { 
          id: "usa", 
          name: "United States", 
          documents: [
            { id: "ind", name: "IND (Investigational New Drug)", purpose: "To begin clinical trials (Phases I-III)" },
            { id: "nda", name: "NDA (New Drug Application)", purpose: "To request approval for marketing a new drug" },
            { id: "bla", name: "BLA (Biologics License Application)", purpose: "For biologics approval under the Public Health Service Act" }
          ], 
          coords: { x: 150, y: 100 } 
        },
        { 
          id: "canada", 
          name: "Canada", 
          documents: [
            { id: "cta_ca", name: "Clinical Trial Application (Health Canada)", purpose: "To authorize clinical trials in Canada" },
            { id: "nds", name: "New Drug Submission (NDS)", purpose: "For drug approval in Canada" },
            { id: "noc", name: "Notice of Compliance (NOC)", purpose: "Canadian marketing authorization" }
          ], 
          coords: { x: 200, y: 80 } 
        },
        { 
          id: "mexico", 
          name: "Mexico", 
          documents: [
            { id: "cofepris_cta", name: "COFEPRIS Clinical Trial Authorization", purpose: "Mexican clinical trial approval" },
            { id: "cofepris_nda", name: "COFEPRIS New Drug Registration", purpose: "Mexican marketing authorization" }
          ], 
          coords: { x: 120, y: 140 } 
        }
      ],
      color: "#4299e1",
      coords: { x: 180, y: 120 }
    },
    "europe": {
      name: "Europe", 
      countries: [
        { 
          id: "eu", 
          name: "European Union", 
          documents: [
            { id: "cta_eu", name: "CTA (Clinical Trial Application)", purpose: "To authorize clinical trials via CTIS" },
            { id: "maa", name: "MAA (Marketing Authorization Application)", purpose: "To request EU-wide marketing approval" },
            { id: "impd", name: "IMPD (Investigational Medicinal Product Dossier)", purpose: "Quality, manufacturing and control information" }
          ], 
          coords: { x: 480, y: 110 } 
        },
        { 
          id: "uk", 
          name: "United Kingdom", 
          documents: [
            { id: "cta_uk", name: "Clinical Trial Authorisation (UK)", purpose: "MHRA clinical trial approval post-Brexit" },
            { id: "ma_uk", name: "Marketing Authorisation (UK)", purpose: "MHRA marketing approval" },
            { id: "vie", name: "Voluntary Scheme for Branded Medicines Pricing", purpose: "UK pricing and access" }
          ], 
          coords: { x: 440, y: 95 } 
        },
        { 
          id: "switzerland", 
          name: "Switzerland", 
          documents: [
            { id: "cta_ch", name: "Clinical Trial Authorisation (Swissmedic)", purpose: "Swiss clinical trial approval" },
            { id: "ma_ch", name: "Marketing Authorisation (Switzerland)", purpose: "Swissmedic drug approval" }
          ], 
          coords: { x: 485, y: 105 } 
        },
        { 
          id: "russia", 
          name: "Russia", 
          documents: [
            { id: "cta_ru", name: "Clinical Trial Permit (Roszdravnadzor)", purpose: "Russian clinical trial authorization" },
            { id: "rd_ru", name: "Registration Dossier (Russia)", purpose: "Russian drug registration with Roszdravnadzor" },
            { id: "gmp_ru", name: "Russian GMP Certificate", purpose: "Manufacturing authorization in Russia" }
          ], 
          coords: { x: 580, y: 90 } 
        }
      ],
      color: "#48bb78",
      coords: { x: 500, y: 110 }
    },
    "asia-pacific": {
      name: "Asia Pacific",
      countries: [
        { 
          id: "japan", 
          name: "Japan", 
          documents: [
            { id: "ctn_jp", name: "Clinical Trial Notification (CTN)", purpose: "Submitted to PMDA before clinical trials" },
            { id: "jnda", name: "J-NDA (New Drug Application)", purpose: "Submitted to PMDA/MHLW for approval" },
            { id: "pmda_consultation", name: "PMDA Scientific Advice", purpose: "Regulatory guidance consultation" }
          ], 
          coords: { x: 720, y: 110 } 
        },
        { 
          id: "china", 
          name: "China", 
          documents: [
            { id: "ind_ch", name: "IND (China)", purpose: "Required before clinical trials (submitted to NMPA)" },
            { id: "nda_ch", name: "NDA (China)", purpose: "Required for marketing approval with NMPA" },
            { id: "drug_license_ch", name: "Drug Registration Certificate", purpose: "Chinese drug license for commercialization" }
          ], 
          coords: { x: 680, y: 120 } 
        },
        { 
          id: "south-korea", 
          name: "South Korea", 
          documents: [
            { id: "ind_kr", name: "IND (Korea)", purpose: "Korean clinical trial application to MFDS" },
            { id: "nda_kr", name: "NDA (Korea)", purpose: "New drug application to MFDS" },
            { id: "kgmp", name: "Korean GMP Certificate", purpose: "Manufacturing authorization" }
          ], 
          coords: { x: 710, y: 115 } 
        },
        { 
          id: "australia", 
          name: "Australia", 
          documents: [
            { id: "ctn_au", name: "CTN (Clinical Trial Notification)", purpose: "TGA notification scheme for clinical trials" },
            { id: "aus", name: "AUS (Australian Submission)", purpose: "Submission to TGA for ARTG registration" },
            { id: "tga_gmp", name: "TGA GMP Certificate", purpose: "Australian manufacturing license" }
          ], 
          coords: { x: 750, y: 220 } 
        },
        { 
          id: "singapore", 
          name: "Singapore", 
          documents: [
            { id: "cta_sg", name: "Clinical Trial Certificate (HSA)", purpose: "Singapore clinical trial approval" },
            { id: "product_license_sg", name: "Product License (Singapore)", purpose: "HSA marketing authorization" }
          ], 
          coords: { x: 670, y: 170 } 
        },
        { 
          id: "india", 
          name: "India", 
          documents: [
            { id: "cta_in", name: "Clinical Trial Permission (CDSCO)", purpose: "Indian clinical trial approval" },
            { id: "nda_in", name: "New Drug Application (India)", purpose: "CDSCO marketing approval" },
            { id: "import_license_in", name: "Import License", purpose: "Drug import authorization" }
          ], 
          coords: { x: 620, y: 150 } 
        },
        { 
          id: "taiwan", 
          name: "Taiwan", 
          documents: [
            { id: "ind_tw", name: "IND (Taiwan)", purpose: "TFDA clinical trial application" },
            { id: "nda_tw", name: "NDA (Taiwan)", purpose: "TFDA new drug approval" }
          ], 
          coords: { x: 705, y: 130 } 
        }
      ],
      color: "#ed8936",
      coords: { x: 680, y: 150 }
    },
    "latin-america": {
      name: "Latin America",
      countries: [
        { 
          id: "brazil", 
          name: "Brazil", 
          documents: [
            { id: "anvisa_cta", name: "ANVISA Clinical Trial Authorization", purpose: "Brazilian clinical trial approval" },
            { id: "anvisa_nda", name: "ANVISA Registration Dossier", purpose: "Brazilian drug registration" },
            { id: "anvisa_gmp", name: "ANVISA GMP Certificate", purpose: "Brazilian manufacturing authorization" }
          ], 
          coords: { x: 280, y: 190 } 
        },
        { 
          id: "argentina", 
          name: "Argentina", 
          documents: [
            { id: "anmat_cta", name: "ANMAT Clinical Trial Authorization", purpose: "Argentine clinical trial approval" },
            { id: "anmat_nda", name: "ANMAT Drug Registration", purpose: "Argentine marketing authorization" }
          ], 
          coords: { x: 260, y: 240 } 
        },
        { 
          id: "colombia", 
          name: "Colombia", 
          documents: [
            { id: "invima_cta", name: "INVIMA Clinical Trial Permit", purpose: "Colombian clinical trial authorization" },
            { id: "invima_nda", name: "INVIMA Drug Registration", purpose: "Colombian marketing approval" }
          ], 
          coords: { x: 220, y: 170 } 
        },
        { 
          id: "chile", 
          name: "Chile", 
          documents: [
            { id: "isp_cta", name: "ISP Clinical Trial Authorization", purpose: "Chilean clinical trial approval" },
            { id: "isp_nda", name: "ISP Drug Registration", purpose: "Chilean marketing authorization" }
          ], 
          coords: { x: 240, y: 250 } 
        }
      ],
      color: "#9f7aea",
      coords: { x: 250, y: 200 }
    },
    "africa-middle-east": {
      name: "Africa & Middle East",
      countries: [
        { 
          id: "south-africa", 
          name: "South Africa", 
          documents: [
            { id: "sahpra_cta", name: "SAHPRA Clinical Trial Authorization", purpose: "South African clinical trial approval" },
            { id: "sahpra_nda", name: "SAHPRA Medicine Registration", purpose: "South African marketing authorization" }
          ], 
          coords: { x: 520, y: 230 } 
        },
        { 
          id: "israel", 
          name: "Israel", 
          documents: [
            { id: "moh_israel_cta", name: "Israeli MOH Clinical Trial Permit", purpose: "Israeli clinical trial approval" },
            { id: "moh_israel_nda", name: "Israeli Drug Registration", purpose: "Israeli marketing authorization" }
          ], 
          coords: { x: 510, y: 140 } 
        },
        { 
          id: "saudi-arabia", 
          name: "Saudi Arabia", 
          documents: [
            { id: "sfda_cta", name: "SFDA Clinical Trial Authorization", purpose: "Saudi clinical trial approval" },
            { id: "sfda_nda", name: "SFDA Drug Registration", purpose: "Saudi marketing authorization" }
          ], 
          coords: { x: 540, y: 150 } 
        },
        { 
          id: "uae", 
          name: "United Arab Emirates", 
          documents: [
            { id: "dha_cta", name: "DHA Clinical Trial Permit", purpose: "UAE clinical trial approval" },
            { id: "moh_uae_nda", name: "UAE Drug Registration", purpose: "UAE marketing authorization" }
          ], 
          coords: { x: 560, y: 155 } 
        }
      ],
      color: "#e53e3e",
      coords: { x: 530, y: 170 }
    }
  };

  const handleRegionClick = (regionId) => {
    setSelectedRegion(selectedRegion === regionId ? null : regionId);
  };

  const handleCountrySelect = (country, region) => {
    onCountrySelect({
      country: country.name,
      countryId: country.id,
      region: regions[region].name,
      availableDocuments: country.documents
    });
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '30px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#2d3748' }}>
        🌍 Global Regulatory Document Map
      </h2>
      <p style={{ textAlign: 'center', color: '#4a5568', marginBottom: '30px' }}>
        Select a region to explore available regulatory documents by country
      </p>

      {/* Interactive World Map */}
      <div style={{ position: 'relative', width: '100%', height: '350px', margin: '20px 0' }}>
        <svg 
          width="100%" 
          height="350" 
          viewBox="0 0 800 350"
          style={{ 
            backgroundColor: '#f7fafc', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        >
          {/* Simplified world map background */}
          <rect width="800" height="350" fill="#e2e8f0" />
          
          {/* Continental shapes (simplified) */}
          <path d="M 50 80 L 300 80 L 300 180 L 50 180 Z" fill="#cbd5e0" opacity="0.3" />
          <path d="M 420 70 L 600 70 L 600 160 L 420 160 Z" fill="#cbd5e0" opacity="0.3" />
          <path d="M 620 90 L 780 90 L 780 280 L 620 280 Z" fill="#cbd5e0" opacity="0.3" />
          <path d="M 180 160 L 320 160 L 320 300 L 180 300 Z" fill="#cbd5e0" opacity="0.3" />
          <path d="M 500 140 L 600 140 L 600 280 L 500 280 Z" fill="#cbd5e0" opacity="0.3" />

          {/* Region markers */}
          {Object.entries(regions).map(([regionId, region]) => (
            <g key={regionId}>
              {/* Region circle */}
              <circle
                cx={region.coords.x}
                cy={region.coords.y}
                r={selectedRegion === regionId ? "35" : "25"}
                fill={region.color}
                opacity={hoveredRegion === regionId ? "0.8" : "0.6"}
                stroke={selectedRegion === regionId ? "#2d3748" : "white"}
                strokeWidth={selectedRegion === regionId ? "3" : "2"}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={() => setHoveredRegion(regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick(regionId)}
              />
              
              {/* Region label */}
              <text
                x={region.coords.x}
                y={region.coords.y + (selectedRegion === regionId ? 50 : 40)}
                textAnchor="middle"
                fill="#2d3748"
                fontSize={selectedRegion === regionId ? "13" : "11"}
                fontWeight={selectedRegion === regionId ? "bold" : "normal"}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleRegionClick(regionId)}
              >
                {region.name}
              </text>

              {/* Country dots when region is selected */}
              {selectedRegion === regionId && region.countries.map((country) => (
                <g key={country.id}>
                  <circle
                    cx={country.coords.x}
                    cy={country.coords.y}
                    r="8"
                    fill="white"
                    stroke={region.color}
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCountrySelect(country, regionId)}
                  />
                  <circle
                    cx={country.coords.x}
                    cy={country.coords.y}
                    r="4"
                    fill={region.color}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCountrySelect(country, regionId)}
                  />
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* Region Details */}
      {selectedRegion && (
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px',
          border: `2px solid ${regions[selectedRegion].color}`
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: regions[selectedRegion].color,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📍 {regions[selectedRegion].name}
            <span style={{ 
              fontSize: '0.8rem', 
              background: regions[selectedRegion].color,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {regions[selectedRegion].countries.length} countries
            </span>
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {regions[selectedRegion].countries.map((country) => (
              <div
                key={country.id}
                onClick={() => handleCountrySelect(country, selectedRegion)}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = regions[selectedRegion].color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                    {country.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                    {country.documents.length} document type{country.documents.length !== 1 ? 's' : ''} available
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.2rem',
                  color: regions[selectedRegion].color
                }}>
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#ebf8ff',
        borderRadius: '8px',
        border: '1px solid #bee3f8'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#2c5282' }}>
          💡 <strong>How to use:</strong> Click on a region above to see available countries, 
          then click on a country to proceed to the regulatory document generator with pre-selected options.
        </div>
      </div>
    </div>
  );
};

const RegulatoryDocuments = () => {
  const navigate = useNavigate();

  const handleCountrySelection = (countryData) => {
    // Navigate to the regulatory document generator with selected country data
    navigate('/ind-modules', {
      state: {
        selectedCountry: countryData.country,
        selectedCountryId: countryData.countryId,
        selectedRegion: countryData.region,
        selectedDocuments: countryData.availableDocuments
      }
    });
  };

  return (
    <div className="regulatory-documents max-w-6xl mx-auto py-8 px-4">
      <InteractiveRegulatoryMap onCountrySelect={handleCountrySelection} />
    </div>
  );
};

export default RegulatoryDocuments;