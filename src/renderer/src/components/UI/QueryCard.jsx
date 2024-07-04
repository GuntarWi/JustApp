import React from 'react';
import { TbPlayerPlay,TbEdit,TbTrashX,TbSql,TbFileSmile,TbPencil} from "react-icons/tb";

const QueryCard = ({
  notificationTitle = "New notification",
  messageAuthor = "Ilena Khadka",
  messageText = "commented on your photo",
  timeAgo = "a few seconds ago",
  executeQuery,
  editQuery,
  deleteQuery,
  query
}) => {


    
  return (
    <div
      role="alert"
      className="w-full max-w-xs p-4 text-gray-900 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-300"
      id="toast-notification"
    >
      <div className="flex items-center mb-3 justify-between">
    <div className="div ">
    <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
          {notificationTitle}
        </span>
    </div>
        <div className="QueryCardButtons flex">
        <button
          onClick={() => deleteQuery(query)}
          className="flex items-center justify-center w-4 h-4 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none"
        >
          <span>
            <TbTrashX className="p-0.5 text-stone-600 " />
          </span>
        </button>
        <button
          onClick={() => editQuery(query)}
          className="flex mr-1 ml-1 items-center justify-center w-4 h-4 bg-yellow-500 rounded-full hover:bg-yellow-600 focus:outline-none"
        >
          <span>
            <TbPencil className="p-0.5 text-stone-600 " />
          </span>
        </button>
        <button
          onClick={() => executeQuery(query)}
          className="flex items-center justify-center w-4 h-4 bg-green-500 rounded-full hover:bg-green-600 focus:outline-none"
        >
          <span >
            <TbPlayerPlay className="p-0.5 text-stone-600 " />
          </span>
        </button>
        </div>



      </div>
      <div className="flex items-center">
        <div className="relative inline-block shrink-0">
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl">
          <TbSql />
          </div>
          <span className="absolute bottom-0 right-0 inline-flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
          <TbFileSmile className="text-white"/>
            <span className="sr-only">Message icon</span>
          </span>
        </div>
        <div className="ms-3 text-sm font-normal">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {messageAuthor}
          </div>
          <div className="text-sm font-normal">{messageText}</div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-500">
            {timeAgo}
          </span>
        </div>
      </div>
      <div className="mt-3">


      </div>
    </div>
  );
};

export default QueryCard;
