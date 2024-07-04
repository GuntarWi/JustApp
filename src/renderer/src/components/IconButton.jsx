import React from 'react';
import PropTypes from 'prop-types';

const IconButton = ({ icon: Icon, label = 'Button', onClick, labelClassName = '', iconClassName = '' ,svgClassName = '',btnClassName = ''}) => {
  return (
    <button className={`noselect button-1 ${btnClassName}`} onClick={onClick}>
      <span className={`text-button ${labelClassName}`}>{label}</span>
      <span className={`icon ${iconClassName}`}>
        <Icon className={`${svgClassName}`}width="24" height="24" />
      </span>
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
  labelClassName: PropTypes.string,
  iconClassName: PropTypes.string,
  svgClassNam: PropTypes.string,
  btnClassName: PropTypes.string,
};

export default IconButton;
