import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useCollaboration = (projectId: string) => {
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = io();

    socket.current.on('connect', () => {
      console.log('Connected to collaboration server');
      socket.current?.emit('project:join', projectId);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [projectId]);

  const emit = (event: string, data: any) => {
    socket.current?.emit(event, { ...data, projectId });
  };

  const on = (event: string, callback: (data: any) => void) => {
    socket.current?.on(event, callback);
    return () => {
      socket.current?.off(event, callback);
    };
  };

  return { emit, on };
};
