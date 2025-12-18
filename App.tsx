import React, { useState } from 'react';
import { DocumentService } from './services/documentService';
import { enrichVisitData } from './utils/dateUtils';
import { Visit, ViewMode, ProcessingStatus } from './types';
import { FileUpload } from './components/FileUpload';
import { VisitTable } from './components/VisitTable';
import { Analytics } from './components/Analytics';
import { LayoutDashboard, Table as TableIcon, AlertTriangle, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DATA_ENTRY);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setStatus('processing');
    setErrorMessage(null);
    try {
      // Use local DocumentService instead of AI
      const rawVisits = await DocumentService.extractVisitsFromImageOrPdf(file);
      
      if (rawVisits.length === 0) {
        throw new Error("No visits found. Please check the document format.");
      }

      const enrichedVisits = enrichVisitData(rawVisits);
      setVisits(enrichedVisits);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to process document.");
    }
  };

  const handleUpdateVisit = (id: string, field: keyof Visit, value: string) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAutoAssignTeams = (config: {
    dayEven: string;
    dayOdd: string;
    nightEven: string;
    nightOdd: string;
  }) => {
    setVisits(prev => prev.map(visit => {
      // Extract day from DD/MM/YYYY
      const dateParts = visit.shiftDate.split('/');
      if (dateParts.length !== 3) return visit;

      const day = parseInt(dateParts[0], 10);
      const isEven = day % 2 === 0;
      
      let assignedTeam = '';

      if (visit.shiftType === 'DIURNO') {
        assignedTeam = isEven ? config.dayEven : config.dayOdd;
      } else {
        // NOTURNO
        assignedTeam = isEven ? config.nightEven : config.nightOdd;
      }

      // If a team name was configured for this slot, update it. Otherwise keep existing.
      if (assignedTeam && assignedTeam.trim() !== '') {
        return { ...visit, team: assignedTeam };
      }
      
      return visit;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">VisitLog Dashboard</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Automated Parsing & Analytics</p>
              </div>
            </div>
            
            {visits.length > 0 && (
              <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode(ViewMode.DATA_ENTRY)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === ViewMode.DATA_ENTRY
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <TableIcon size={16} className="mr-2" />
                  Data Entry
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.ANALYTICS)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === ViewMode.ANALYTICS
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  Analytics
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Alert */}
        {status === 'error' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {status === 'success' && visits.length > 0 && viewMode === ViewMode.DATA_ENTRY && (
           <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between animate-fade-in-down">
              <div className="flex items-center">
                 <CheckCircle className="text-green-500 mr-2" size={20}/>
                 <span className="text-green-800 font-medium">Successfully extracted {visits.length} visits.</span>
              </div>
              <button onClick={() => setStatus('idle')} className="text-green-600 hover:text-green-800"><CheckCircle size={16}/></button>
           </div>
        )}

        {/* Initial State / File Upload */}
        {visits.length === 0 && (
          <div className="mt-10">
            <div className="text-center mb-10">
               <h2 className="text-3xl font-bold text-slate-800 mb-4">Transform PDF Logs into Insights</h2>
               <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                 Upload your shift visit logs (PDF or Text). We'll automatically identify dates, times, shifts, and locations.
               </p>
            </div>
            <FileUpload 
              onFileSelect={handleFileSelect} 
              isProcessing={status === 'processing'} 
            />
            
            {/* Instruction Card */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-sm border border-slate-200 mt-8">
                <h4 className="font-semibold text-slate-800 mb-2">How logic works:</h4>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    <li><strong>Day Shift (Diurno):</strong> 07:00 - 18:59</li>
                    <li><strong>Night Shift (Noturno):</strong> 19:00 - 06:59 (counts towards the shift start date)</li>
                    <li><strong>Teams:</strong> Define specific teams for Even/Odd days and Day/Night shifts.</li>
                </ul>
            </div>
          </div>
        )}

        {/* Main Content */}
        {visits.length > 0 && (
          <div className="transition-all duration-300">
            {viewMode === ViewMode.DATA_ENTRY ? (
              <VisitTable 
                visits={visits} 
                onUpdateVisit={handleUpdateVisit}
                onAutoAssignTeams={handleAutoAssignTeams}
              />
            ) : (
              <Analytics visits={visits} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;