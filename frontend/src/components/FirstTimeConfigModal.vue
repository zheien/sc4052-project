  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: white;
  padding: 2rem 2.5rem;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  min-width: 350px;
  max-width: 90vw;
  /* text-align: center; */
}
.modal-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.modal-desc {
  color: #555;
  margin-bottom: 2rem;
}
.modal-btn {
  margin-top: 1.5rem;
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.modal-btn:hover {
  background: #357abd;
}

