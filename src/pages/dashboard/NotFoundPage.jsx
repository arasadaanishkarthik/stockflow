import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { PackageSearch, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 ring-8 ring-blue-50/50 dark:ring-blue-950/30">
        <PackageSearch className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
        404 — Location Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
        The inventory page or resource you are looking for has been relocated or does not exist in the catalog.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" icon={Home}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
