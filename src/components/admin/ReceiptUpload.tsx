import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReceiptUploadProps {
  loanId: string;
  feeType: 'application_fee' | 'approval_fee';
  onUploadComplete?: (filePath: string) => void;
  className?: string;
}

export function ReceiptUpload({ loanId, feeType, onUploadComplete, className }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPEG, PNG, WebP) or PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${loanId}/${feeType}_receipt_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('loan-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadedFile(file.name);
      onUploadComplete?.(data.path);
      
      toast({
        title: 'Receipt uploaded',
        description: 'The receipt has been uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload receipt',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm text-muted-foreground">
        Receipt Upload (Optional)
      </Label>
      
      {uploadedFile ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{uploadedFile}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id={`receipt-${loanId}-${feeType}`}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="w-full justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload receipt
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
