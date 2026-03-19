import { Suspense } from 'react';
import ProductsContent from './ProductsContent';

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="page-container"><div className="loading-page"><div className="spinner"></div></div></div>}>
            <ProductsContent />
        </Suspense>
    );
}
