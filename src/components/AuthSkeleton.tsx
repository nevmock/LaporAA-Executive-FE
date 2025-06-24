'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const LoginFormSkeleton: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <Skeleton circle width="80px" height="80px" className="mx-auto mb-4" />
        <Skeleton height="32px" width="250px" className="mx-auto mb-2" />
        <Skeleton height="20px" width="200px" className="mx-auto" />
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-8">
        <div className="space-y-6">
          <div>
            <Skeleton height="16px" width="80px" className="mb-2" />
            <Skeleton height="40px" width="100%" rounded />
          </div>
          
          <div>
            <Skeleton height="16px" width="80px" className="mb-2" />
            <Skeleton height="40px" width="100%" rounded />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton width="16px" height="16px" className="mr-2" />
              <Skeleton height="14px" width="100px" />
            </div>
            <Skeleton height="14px" width="120px" />
          </div>
          
          <Skeleton height="44px" width="100%" rounded />
        </div>
      </div>
    </div>
  </div>
);

export const AuthSkeleton: React.FC = () => <LoginFormSkeleton />;
