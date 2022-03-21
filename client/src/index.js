import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import '../src/fonts/roboto/Roboto-Regular.ttf'
import '../src/fonts/rubik/RubikMonoOne-Regular.ttf'
import '../src/fonts/josefin/JosefinSans-Regular.ttf'
import '../src/fonts/fira_sans/FiraSans-Regular.ttf'
import '../src/fonts/signika_negative/SignikaNegative-Regular.ttf'
import '../src/fonts/source_sans_pro/SourceSansPro-Regular.ttf'
import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
