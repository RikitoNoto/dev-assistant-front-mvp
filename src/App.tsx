import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import ConversationPage from './pages/ConversationPage';
// import IssueTrackerPage from './pages/IssueTrackerPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        {/* <Route path="/project/:projectId/conversation/tickets" element={<IssueTrackerPage />} /> */}
        <Route path="/project/:projectId/conversation/:type" element={<ConversationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
