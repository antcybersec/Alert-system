import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const PageHeader = ({
    title,
    description,
    showBack = false,
    backUrl,
    children,
    className
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 animate-fade-in", className)}>
            <div className="space-y-1">
                {showBack && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 mb-1"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl">
                        {description}
                    </p>
                )}
            </div>

            {children && (
                <div className="flex items-center gap-3 shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
