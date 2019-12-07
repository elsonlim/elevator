const elevator = () => {
  return {
    init: function(elevators, floors) {
      const MAX_LEVEL = floors.length - 1;

      class ElevatorCtl {
        constructor(elevator) {
          this.elevator = elevator;
          this.floorToStop = [];
          this.elevator.goingUpIndicator(true);
          this.elevator.goingDownIndicator(false);
        }

        addFloorToStop(num) {
          if (!this.floorToStop.includes(num)) {
            this.floorToStop.push(num);
            this.floorToStop.sort((a, b) => a - b);
          }
        }

        removeFloorToStop(num) {
          if (this.floorToStop.includes(num)) {
            const filteredFloors = this.floorToStop.filter(cur => num !== cur);
            this.floorToStop = filteredFloors;
          }
        }

        goToNextUpperFloor() {
          this.elevator.goingUpIndicator(true);
          this.elevator.goingDownIndicator(false);

          const curFloor = this.elevator.currentFloor();
          const targetFloors = this.floorToStop.filter(num => {
            return num > curFloor;
          });

          if (targetFloors.length) {
            const nextFloor = targetFloors.shift();
            this.elevator.goToFloor(nextFloor, true);
            return nextFloor;
          }
          return false;
        }

        goToNextLowerFloor() {
          this.elevator.goingUpIndicator(false);
          this.elevator.goingDownIndicator(true);

          const curFloor = this.elevator.currentFloor();
          const targetFloors = this.floorToStop.filter(num => num < curFloor);

          if (targetFloors.length) {
            const nextFloor = targetFloors.pop();
            this.elevator.goToFloor(nextFloor, true);
            return nextFloor;
          }
          return false;
        }

        hasHigherFloorToStop() {
          const curFloor = this.elevator.currentFloor();
          return !!this.floorToStop.filter(num => {
            return num > curFloor;
          }).length;
        }

        hasLowerFloorToStop() {
          const curFloor = this.elevator.currentFloor();
          return !!this.floorToStop.filter(num => {
            return num < curFloor;
          }).length;
        }

        getCurFloor() {
          return this.elevator.currentFloor();
        }

        goToNextFloor() {
          console.log(
            "next",
            this.elevator.currentFloor(),
            this.elevator.goingUpIndicator(),
            this.elevator.goingDownIndicator(),
          );

          if (this.elevator.currentFloor() === 0) {
            this.elevator.goingUpIndicator(true);
            this.elevator.goingDownIndicator(false);
            return this.goToNextUpperFloor();
          } else if (this.elevator.currentFloor() === MAX_LEVEL) {
            this.elevator.goingUpIndicator(false);
            this.elevator.goingDownIndicator(true);
            return this.goToNextLowerFloor();
          }

          const isGoingUp = this.elevator.goingUpIndicator();

          if (isGoingUp && this.hasHigherFloorToStop()) {
            return this.goToNextUpperFloor();
          } else if (!isGoingUp && this.hasLowerFloorToStop()) {
            return this.goToNextLowerFloor();
          } else if (isGoingUp && this.hasLowerFloorToStop()) {
            return this.goToNextLowerFloor();
          } else if (!isGoingUp && this.hasHigherFloorToStop()) {
            return this.goToNextUpperFloor();
          }
        }
      }

      var elevatorControllers = elevators.map(elevator => {
        elevator.goingUpIndicator(true);
        return new ElevatorCtl(elevator);
      });
      var elevatorCtrl = elevatorControllers[0]; // Let's use the first elevator

      floors.forEach(floor => {
        floor.on("up_button_pressed", function() {
          elevatorCtrl.addFloorToStop(floor.floorNum());
          console.log(
            "on floor up press",
            floor.floorNum(),
            elevatorCtrl.floorToStop,
          );
        });
        floor.on("down_button_pressed", function() {
          elevatorCtrl.addFloorToStop(floor.floorNum());
          console.log(
            "on floor down press",
            floor.floorNum(),
            elevatorCtrl.floorToStop,
          );
        });
      });
      elevatorCtrl.elevator.on("floor_button_pressed", function(floorNum) {
        elevatorCtrl.addFloorToStop(floorNum);
        console.log(
          "on elevator floor button press",
          floorNum,
          elevatorCtrl.floorToStop,
        );
      });

      elevatorCtrl.elevator.on("stopped_at_floor", function(floorNum) {
        console.log("stopped");
        // Maybe decide where to go next?
        elevatorCtrl.removeFloorToStop(floorNum);
        elevatorCtrl.elevator.getPressedFloors().forEach(floorNum => {
          elevatorCtrl.addFloorToStop(floorNum);
        });
        elevatorCtrl.goToNextFloor();
      });

      elevatorCtrl.elevator.on("idle", function() {
        console.log("idle", elevatorCtrl.floorToStop);
        elevatorCtrl.elevator.getPressedFloors().forEach(floorNum => {
          elevatorCtrl.addFloorToStop(floorNum);
        });
        elevatorCtrl.goToNextFloor();
      });
    },
    update: function(dt, elevators, floors) {
      // We normally don't need to do anything here
    },
  };
};
