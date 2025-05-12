import React from 'react';
import dataOpd from '../../../../api/dataPresentasiOpd.json';

const LeaderBoardCard = () => {
  const data = dataOpd;

  return (
    <div className="bg-white shadow-md rounded-xl p-6 w-full h-[600px] overflow-y-scroll">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">
          Yearly Leaderboard
        </h4>
      </div>
      <div className="flow-root">
        <ul role="list" className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <li className="py-3 sm:py-4" key={index}>
              <div className="flex items-center">
                <div
                  className={`inline-flex items-center text-base font-semibold text-gray-900 border rounded-full w-8 h-8 justify-center ${
                    index > 2 ? 'bg-gray-200' : ''
                  }`}
                >
                  {index === 0 ? (
                    <span className="text-2xl">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-2xl">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-2xl">🥉</span>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0 ms-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.opd}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {item.score_ranking}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeaderBoardCard;
