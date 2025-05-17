import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './Auth';

function Notification({ duration = 3000 }) {
  const { user } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [user, duration]);

  if (!visible || !user) return null;

  return (
    <div className="notification">
      Welcome, {user.email}
    </div>
  );
}

export default Notification;