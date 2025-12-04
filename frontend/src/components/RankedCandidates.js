import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import candidateService from '../services/candidateService';
import { Briefcase, GraduationCap, Code, BookOpen, Award, Star, Eye } from 'lucide-react';
import './RankedCandidates.css';

const RankedCandidates = ({ jobId, jobTitle }) => {
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (jobId) {
      loadCandidates();
    }
  }, [jobId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await candidateService.getRankedCandidates(jobId);
      if (response.success) {
        setCandidates(response.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="ranked-candidates-loading">Loading candidates...</div>;
  }

  if (error) {
    return <div className="ranked-candidates-error">{error}</div>;
  }

  return (
    <div className="ranked-candidates-container">
      <div className="ranked-candidates-header">
        <h2>Ranked Candidates for {jobTitle}</h2>
        <p>Sorted by ATS Match Score (Highest First)</p>
      </div>

      <div className="candidates-list">
        {candidates.map((candidate, index) => (
          <CandidateCard key={candidate.id} candidate={candidate} rank={index + 1} />
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="no-candidates">No candidates found</div>
      )}
    </div>
  );
};

const CandidateCard = ({ candidate, rank }) => {
  const { t } = useLanguage();
  const isGraduate = candidate.isGraduate === true;

  return (
    <div className="candidate-card">
      <div className="candidate-rank">
        <Star className="rank-icon" size={20} />
        <span className="rank-number">#{rank}</span>
        <div className="candidate-score">
          <span className="score-label">Match Score:</span>
          <span className="score-value">{((candidate.score || 0) * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="candidate-info">
        <h3 className="candidate-name">{candidate.fullName}</h3>
        <p className="candidate-email">{candidate.email}</p>
      </div>

      <div className="candidate-highlights">
        {/* Show Skills */}
        <div className="highlight-item">
          <Code size={16} />
          <span>
            <strong>Skills:</strong> {candidate.skills?.length || 0} skills
            {candidate.scoreBreakdown?.skillsScore && (
              <span className="score-badge">
                {(candidate.scoreBreakdown.skillsScore * 100).toFixed(0)}%
              </span>
            )}
          </span>
        </div>

        {/* Show Courses (especially important for graduates) */}
        {candidate.courses && candidate.courses.length > 0 && (
          <div className="highlight-item">
            <BookOpen size={16} />
            <span>
              <strong>Courses:</strong> {candidate.courses.length} courses
              {candidate.scoreBreakdown?.coursesScore && (
                <span className="score-badge">
                  {(candidate.scoreBreakdown.coursesScore * 100).toFixed(0)}%
                </span>
              )}
            </span>
          </div>
        )}

        {/* Show Education */}
        {candidate.education && candidate.education.length > 0 && (
          <div className="highlight-item">
            <GraduationCap size={16} />
            <span>
              <strong>Education:</strong> {candidate.education.length} degree(s)
              {candidate.scoreBreakdown?.educationScore && (
                <span className="score-badge">
                  {(candidate.scoreBreakdown.educationScore * 100).toFixed(0)}%
                </span>
              )}
            </span>
          </div>
        )}

        {/* Hide Experience for graduates */}
        {!isGraduate && candidate.experience && candidate.experience.length > 0 && (
          <div className="highlight-item">
            <Briefcase size={16} />
            <span>
              <strong>Experience:</strong> {candidate.experience.length} position(s)
              {candidate.scoreBreakdown?.experienceScore && (
                <span className="score-badge">
                  {(candidate.scoreBreakdown.experienceScore * 100).toFixed(0)}%
                </span>
              )}
            </span>
          </div>
        )}

        {/* Show graduate badge */}
        {isGraduate && (
          <div className="highlight-item graduate-badge">
            <Award size={16} />
            <span><strong>Fresh Graduate</strong> - Experience not required</span>
          </div>
        )}
      </div>

      <div className="candidate-actions">
        <button className="view-profile-btn">
          <Eye size={16} /> View Full Profile
        </button>
      </div>
    </div>
  );
};

export default RankedCandidates;

