javascript:(function () { 
    const memberListUrl = 'https://beta.lds.org/mls/mbr/services/report/member-list?lang=eng';
    const memberProfileUrl = 'https://beta.lds.org/mls/mbr/records/member-profile/service/';

    let csvMembersWithParents = 'Name,Father\'s Name,Father\'s Unit,Mother\'s Name,Mother\'s Unit\n';

    requestJson(memberListUrl, onGetMemberListSuccess, () => console.error('Failed to get member list.'));

    let memberProfileCounter;

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
            addModal(csvMembersWithParents);
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

    function addModal(text) {
        let css = 'margin: -300px 0 0 -350px; padding: 0 50px; left: 50%; top: 50%; width: 700px; height: 600px; position: fixed; z-index: 10000; box-sizing: border-box; overflow: auto; white-space: pre; color: #FFFFFF; background-color: rgba(0,0,0,0.8);';

        let modal = document.createElement('div');
        modal.style.cssText = css;
        modal.textContent = text;
        document.body.appendChild(modal);
    }
}());
