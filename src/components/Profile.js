import React from 'react';
import { User, Briefcase, GraduationCap, MapPin, Mail, Phone, Building, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  // Fallback data if user data is not available
  const profileData = user || {
    name: 'Dr. User Name',
    title: 'Clinical Researcher',
    institution: 'Medical Institution',
    email: 'user@institution.org',
    phone: '+1 (555) 000-0000'
  };
  return (
    <div className="profile-container" style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Profile Header */}
      <div style={{
        background: 'var(--color-background-card)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3rem'
          }}>
            <User size={48} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              color: 'var(--color-text)', 
              marginBottom: '0.5rem' 
            }}>
{profileData.name || 'Dr. User Name'}
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: '0.5rem' 
            }}>
{profileData.title || 'Clinical Researcher'}
            </p>
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <MapPin size={16} />
              {profileData.institution || 'Medical Institution'}
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          padding: '1.5rem',
          background: 'var(--color-gray-50)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-light)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text)' }}>
              Contact Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{profileData.email || 'user@institution.org'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{profileData.phone || '+1 (555) 000-0000'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{profileData.department || 'Clinical Research Department'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text)' }}>
              Professional Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Briefcase size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>15+ years clinical research experience</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <GraduationCap size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Board Certified Dermatologist</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>License Valid: 2028</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Professional Summary
          </h2>
          <p style={{ 
            lineHeight: '1.6', 
            color: 'var(--color-text-secondary)', 
            marginBottom: '1rem' 
          }}>
            {profileData.bio || 'Experienced clinical researcher with expertise in medical research and clinical trials. Dedicated to advancing healthcare through evidence-based medicine and innovative therapeutic approaches.'}
          </p>
          <p style={{ 
            lineHeight: '1.6', 
            color: 'var(--color-text-secondary)' 
          }}>
            {profileData.additionalInfo || 'Active contributor to the medical research community with focus on clinical excellence and patient safety. Committed to regulatory compliance and best practices in clinical research.'}
          </p>
        </div>

        <div style={{
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Current Studies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              background: 'var(--color-gray-50)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                PSORA-301 Study
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.25rem 0' }}>
                Phase III Psoriasis Treatment
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <Clock size={12} style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-success)' }}>Active Enrollment</span>
              </div>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              background: 'var(--color-gray-50)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                DERM-202 Study
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.25rem 0' }}>
                Phase II Atopic Dermatitis
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <Clock size={12} style={{ color: 'var(--color-warning)' }} />
                <span style={{ color: 'var(--color-warning)' }}>Follow-up Phase</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials & Settings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        <div style={{
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-text)' }}>
            Credentials & Certifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Medical License (MA)</span>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                background: 'var(--color-success)', 
                color: 'white', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.75rem' 
              }}>
                Active
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Board Certification</span>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                background: 'var(--color-success)', 
                color: 'white', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.75rem' 
              }}>
                Current
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>GCP Certification</span>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                background: 'var(--color-success)', 
                color: 'white', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.75rem' 
              }}>
                Valid
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>IRB Training</span>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                background: 'var(--color-warning)', 
                color: 'white', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.75rem' 
              }}>
                Expires 2025
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-text)' }}>
            Platform Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Email Notifications</span>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                Enabled
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Two-Factor Authentication</span>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                Active
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Data Export Preferences</span>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-gray-400)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                Configure
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>API Access</span>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;