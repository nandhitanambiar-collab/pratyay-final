import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReviewItem, ReviewStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { 
  Search, 
  ArrowUpRight, 
  AlertCircle, 
  FileText, 
  Clock 
} from 'lucide-react';

interface RecentReviewsTableProps {
  reviews: ReviewItem[];
}

export const RecentReviewsTable: React.FC<RecentReviewsTableProps> = ({ reviews }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering logic
  const filteredReviews = reviews.filter((item) => {
    const matchesFilter = activeFilter === 'ALL' || item.status === activeFilter;
    const matchesSearch = 
      item.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs: Array<{ label: string; value: 'ALL' | ReviewStatus; count: number }> = [
    { label: 'All Reviews', value: 'ALL', count: reviews.length },
    { label: 'In Review', value: 'In Review', count: reviews.filter(r => r.status === 'In Review').length },
    { label: 'Needs Changes', value: 'Needs Changes', count: reviews.filter(r => r.status === 'Needs Changes').length },
    { label: 'Approved', value: 'Approved', count: reviews.filter(r => r.status === 'Approved').length },
    { label: 'Drafts', value: 'Draft', count: reviews.filter(r => r.status === 'Draft').length },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recent Content Reviews
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredReviews.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Marketing drafts and campaigns evaluated against brand guidelines and verified evidence.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter campaigns or submitters..."
              className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reviews')}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            View All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === tab.value
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === tab.value
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'bg-slate-200/80 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table responsive container (adhering to modern-web-guidance for responsive-table) */}
      <div 
        tabIndex={0} 
        role="region" 
        aria-label="Recent marketing content reviews" 
        className="overflow-x-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">Recent marketing content reviews and governance verification status</caption>
          <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="py-3.5 px-5">Content / Campaign</th>
              <th scope="col" className="py-3.5 px-5">Submitted By</th>
              <th scope="col" className="py-3.5 px-5">Last Updated</th>
              <th scope="col" className="py-3.5 px-5">Status</th>
              <th scope="col" className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto px-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 text-indigo-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    {reviews.length === 0 ? (
                      <>
                        <h3 className="font-bold text-slate-900 text-sm">No reviews yet</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Start your first brand compliance review to check content against your brand guidelines and available evidence.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/reviews/new')}
                          >
                            Start Your First Review
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/guidelines')}
                          >
                            Configure Guidelines
                          </Button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2.5">
                          Add your brand guidelines and supporting evidence to improve your review results.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-slate-700 text-sm">No matching reviews found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr 
                  key={review.id} 
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Campaign Title & Category */}
                  <th scope="row" className="py-3.5 px-5 font-normal">
                    <button
                      type="button"
                      onClick={() => navigate(`/reviews/${review.id}`)}
                      className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-sm line-clamp-1 text-left cursor-pointer"
                    >
                      {review.campaignTitle}
                    </button>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-mono text-slate-400">{review.id}</span>
                      <span>•</span>
                      <span className="text-slate-600">{review.category}</span>
                      {review.flaggedIssuesCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            {review.flaggedIssuesCount} issue{review.flaggedIssuesCount > 1 ? 's' : ''} flagged
                          </span>
                        </>
                      )}
                    </div>
                  </th>

                  {/* Submitted By */}
                  <td className="py-3.5 px-5 text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                        {review.submittedBy.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{review.submittedBy.name}</p>
                        <p className="text-[10px] text-slate-400">{review.submittedBy.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{review.lastUpdated}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <StatusBadge status={review.status} />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/reviews/${review.id}`)}
                      className="group-hover:border-indigo-300 group-hover:text-indigo-700"
                    >
                      Inspect Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-5">
        <span>Showing {filteredReviews.length} of {reviews.length} total reviews</span>
        <span className="text-slate-400">Deterministic check & claim verification enabled</span>
      </div>
    </div>
  );
};
