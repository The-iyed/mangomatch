import { useState } from 'react';
import Icon from './assets/puzzle-piece-thin-svgrepo-com.svg';
import Place from './assets/place.svg';
//@ts-ignore
import { DragDropContainer, DropTarget } from 'react-drag-drop-container';
import { message, Button, Modal } from 'antd';
import Group_1 from './assets/icons/Group_1.svg';
import Group_2 from './assets/icons/Group_2.svg';
import Group_3 from './assets/icons/Group_3.svg';
import Group_4 from './assets/icons/Group_4.svg';
import Group_5 from './assets/icons/Group_5.svg';
import Group_6 from './assets/icons/Group_9.svg';
import Group_7 from './assets/icons/Group_7.svg';
import Group_8 from './assets/icons/Group_8.svg';
import Bubbles from './assets/bubbles.svg';
import Octo from './assets/octopus.svg';
import Fish from './assets/fish.svg';
import Fish2 from './assets/fish2.svg';
import Fish3 from './assets/fish3.svg';

function App() {
  const initialPlaces = [
    { id: 1, color: 'none', done: false, icon: Group_1 , message:"The nervous system coordinates the body, while marine ecosystems coordinate life in the ocean 🌊." },
    { id: 2, color: 'none', done: false, icon: Group_8 , message:"Both circulate important elements (blood🩸 and nutrients/oxygen) throughout the body and ocean 🌊."},
    { id: 3, color: 'none', done: false, icon: Group_5 , message:"Bones 🦴 provide structure for the body, while coral reefs 🪸 support marine life and structure the ocean 🌊."},
    { id: 0, color: 'none', done: false, icon: Group_6 , message:"Lungs provide oxygen for the body, while Algae 🪸 produce oxygen in the ocean 🌊."},
  ];
  const initialHolderPlaces = [
    { id: 1, color: 'none', done: false, icon: Group_2 },

    { id: 2, color: 'none', done: false, icon: Group_7 },

    { id: 3, color: 'none', done: false, icon: Group_3 },
    { id: 0, color: 'none', done: false, icon: Group_4 },
  ];
  const [places, setPlaces] = useState(initialPlaces);
  const [placeholder, setPlaceholder] = useState(initialHolderPlaces);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [key, setKey] = useState(0);
  const handleDrop = (id: number) => {
    setDone(id);
    removeElement(id);
    if (placeholder.length === 1) {
      setTimeout(() => setIsModalVisible(true), 500);
    }
  };

  const getIconById = (id: number) => {
    const place = initialHolderPlaces.find((item) => item.id === id);
    return place ? place.icon : null;
  };
  const getMessageById = (id: number) => {
    const place = places.find((item) => item.id === id);
    return place ? place.message : null;
  };
  const setDone = (id: number) => {
    message.success(getMessageById(id))
    setPlaces((prevPlaces) =>
      prevPlaces.map((place) =>
      place.id === id ? { ...place, done: true } : place,
      ),
    );
  };

  const removeElement = (id: number) => {
    setPlaceholder((prevPlaceholder) =>
      prevPlaceholder.filter((field) => field.id !== id),
    );
  };

  const resetGame = () => {
    setPlaces(initialPlaces);
    setPlaceholder(initialHolderPlaces);
    setIsModalVisible(false);
    message.info('Game reset! Try again.');
  };
  const handleEndDrag = () => {
    setKey((prevKey) => prevKey + 1);
    setPlaces([...places]);
    setPlaceholder([...placeholder]);
  };
  return (
    <div className="App">
      <div className="wrapper">
        {places.map((piece) => (
          <div
            key={piece.id}
            style={{
              display: 'flex',
              gap: '0',
            }}
          >
            <img width={150} src={piece?.icon} alt="error" />
            <DropTarget
              id="my_target"
              targetKey={`foo${piece.id}`}
              onHit={() => handleDrop(piece.id)}
            >
              <img
                width={150}
                className="image-placeholder"
                style={{
                  marginLeft: '-31px',
                  zIndex: '3',
                  position: 'relative',
                  fill: 'red',
                }}
                src={piece.done ? getIconById(piece?.id) : Place}
                alt="error"
              />
            </DropTarget>
          </div>
        ))}
      </div>
      <div className="wrapper-second" key={key}>
        {placeholder.map((piece) => (
          <div key={piece.id} onMouseLeave={handleEndDrag}>
            <DragDropContainer
              targetKey={`foo${piece.id}`}
              style={{ display: 'block' }}
              dropData={{ type: 'Image' }}
            >
              <img width={150} src={piece?.icon} alt="error" />
            </DragDropContainer>
          </div>
        ))}
      </div>

      <Modal
        title="Congratulations!"
        visible={isModalVisible}
        closable={false}
        style={{
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        footer={[
          <Button type="primary" key="try-again" onClick={resetGame}>
            Try Again
          </Button>,
        ]}
      >
        <div
          style={{
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
          }}
        >
          <p
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '23px',
              margin: 'auto',
              color: 'white',
            }}
          >
            You've just completed the game successfully!
          </p>
        </div>
      </Modal>
      <img
        src={Bubbles}
        className="floating-fish"
        alt="error"
        style={{
          position: 'absolute',
          zIndex: '-1',
          top: '270px',
          left: '30px',
        }}
      />

      <img
        src={Octo}
        className="floating-fish"
        alt="error"
        style={{
          position: 'absolute',
          zIndex: '-1',
          top: '270px',
          left: '30px',
        }}
      />

      <img
        src={Fish}
        className="floating-fish"
        alt="error"
        style={{
          position: 'absolute',
          zIndex: '-1',
          top: '270px',
          right: '30px',
        }}
      />
      <img
        src={Fish2}
        className="floating-fish"
        alt="error"
        style={{
          position: 'absolute',
          zIndex: '-1',
          top: '80%',
          right: '30%',
        }}
        width={90}
      />
      <img
        src={Fish3}
        className="floating-fish"
        alt="error"
        style={{
          position: 'absolute',
          zIndex: '-1',
          top: '80%',
          right: '60%',
        }}
        width={120}
      />
    </div>
  );
}

export default App;
