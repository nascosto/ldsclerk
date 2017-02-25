javascript:(function () { 
    const memberListUrl = 'https://beta.lds.org/mls/mbr/services/report/member-list?lang=eng';
    const memberProfileUrl = 'https://beta.lds.org/mls/mbr/records/member-profile/service/';

    let csvMembersWithParents = 'Name,Father\'s Name,Father\'s Unit,Mother\'s Name,Mother\'s Unit\n';

    let memberProfileCounter;

    generateHomeWardList();

    function generateHomeWardList() {
        requestJson(memberListUrl, onGetMemberListSuccess, () => console.error('Failed to get member list.'));
    }

    function onGetMemberListSuccess(list) {
        memberProfileCounter = list.length;
        for (let i = 0; i < list.length; i++) {
            requestJson(memberProfileUrl + list[i].id + '?lang=eng', onGetMemberProfileSuccess, () => console.error('Failed to get member profile ' + list[i].id));
        }
    }

    function onGetMemberProfileSuccess(member) {
        let name = member.individual.name;
        let fatherName = member.family.parents && member.family.parents.father && member.family.parents.father.name ? member.family.parents.father.name : '';
        let fatherUnit = member.family.parents && member.family.parents.father && member.family.parents.father.unitNumber ? member.family.parents.father.unitNumber : '';
        let motherName = member.family.parents && member.family.parents.mother && member.family.parents.mother.name ? member.family.parents.mother.name : '';
        let motherUnit = member.family.parents && member.family.parents.mother && member.family.parents.mother.unitNumber ? member.family.parents.mother.unitNumber : '';
        csvMembersWithParents += name + ',' + fatherName + ',' + fatherUnit + ',' + motherName + ',' + motherUnit + '\n';

        memberProfileCounter--;
        if (memberProfileCounter === 0) {
            outputToNewWindow(csvMembersWithParents);
        }
    }

    function requestJson(url, onSuccess, onError) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (onSuccess) {
                        let response = JSON.parse(xhr.responseText);
                        onSuccess(response);
                    }
                } else {
                    if (onError) {
                        onError();
                    }
                }
            }
        };
        xhr.open('GET', url);
        xhr.send();
    }

    function outputToNewWindow(text) {
        var url = 'data:application/json;charset=utf8,' + encodeURIComponent(text);
        window.open(url, '_blank');
        window.focus();
    }
}());
